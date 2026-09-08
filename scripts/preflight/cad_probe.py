#!/usr/bin/env python3
"""Audit a STEP assembly through Open Cascade XCAF and export a real GLB sample."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import trimesh
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.StlAPI import StlAPI_Writer
from OCP.TCollection import TCollection_AsciiString, TCollection_ExtendedString
from OCP.TDataStd import TDataStd_Name
from OCP.TDF import TDF_Label, TDF_LabelSequence, TDF_Tool
from OCP.TDocStd import TDocStd_Document
from OCP.TopLoc import TopLoc_Location
from OCP.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ShapeTool


def label_entry(label: TDF_Label) -> str:
    value = TCollection_AsciiString()
    TDF_Tool.Entry_s(label, value)
    return value.ToCString()


def label_name(label: TDF_Label) -> str | None:
    value = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), value):
        return value.Get().ToExtString()
    return None


def matrix(location: TopLoc_Location) -> list[list[float]]:
    transform = location.Transformation()
    return [
        [transform.Value(row, col) for col in range(1, 5)]
        for row in range(1, 4)
    ] + [[0.0, 0.0, 0.0, 1.0]]


def load_xcaf(path: Path):
    document = TDocStd_Document(TCollection_ExtendedString("XmlXCAF"))
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    reader.SetColorMode(True)
    reader.SetLayerMode(True)
    status = reader.ReadFile(str(path))
    if "RetDone" not in str(status):
        raise RuntimeError(f"STEP read failed: {status}")
    if not reader.Transfer(document):
        raise RuntimeError("STEP transfer into XCAF document failed")
    return document, XCAFDoc_DocumentTool.ShapeTool_s(document.Main())


def audit_assembly(path: Path) -> tuple[dict, object]:
    document, shape_tool = load_xcaf(path)
    roots = TDF_LabelSequence()
    shape_tool.GetFreeShapes(roots)
    definitions: set[str] = set()
    instances: list[dict] = []

    def walk(assembly_label: TDF_Label, parent_world: TopLoc_Location, path_ids: list[str]):
        children = TDF_LabelSequence()
        if not XCAFDoc_ShapeTool.GetComponents_s(assembly_label, children, False):
            return
        for index in range(1, children.Length() + 1):
            component = children.Value(index)
            reference = TDF_Label()
            has_reference = XCAFDoc_ShapeTool.GetReferredShape_s(component, reference)
            local = XCAFDoc_ShapeTool.GetLocation_s(component)
            world = parent_world.Multiplied(local)
            component_id = label_entry(component)
            reference_id = label_entry(reference) if has_reference else None
            if reference_id:
                definitions.add(reference_id)
            name = label_name(component) or (label_name(reference) if has_reference else None)
            record = {
                "instance_id": "/".join(path_ids + [component_id]),
                "component_label": component_id,
                "definition_label": reference_id,
                "name": name,
                "local_transform": matrix(local),
                "world_transform": matrix(world),
                "definition_is_assembly": bool(
                    has_reference and XCAFDoc_ShapeTool.IsAssembly_s(reference)
                ),
            }
            instances.append(record)
            if has_reference and XCAFDoc_ShapeTool.IsAssembly_s(reference):
                walk(reference, world, path_ids + [component_id])

    root_records = []
    for index in range(1, roots.Length() + 1):
        root = roots.Value(index)
        root_id = label_entry(root)
        root_records.append(
            {
                "label": root_id,
                "name": label_name(root),
                "is_assembly": bool(XCAFDoc_ShapeTool.IsAssembly_s(root)),
                "direct_components": XCAFDoc_ShapeTool.NbComponents_s(root, False),
            }
        )
        walk(root, TopLoc_Location(), [root_id])

    result = {
        "source": str(path),
        "free_shape_count": roots.Length(),
        "roots": root_records,
        "component_instance_count": len(instances),
        "unique_definition_count": len(definitions),
        "placed_instance_count": sum(
            1
            for item in instances
            if item["local_transform"]
            != [[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]]
        ),
        "instances": instances,
    }
    return result, shape_tool.GetOneShape()


def export_glb(step_path: Path, output_path: Path, linear_deflection: float) -> dict:
    _document, shape_tool = load_xcaf(step_path)
    shape = shape_tool.GetOneShape()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    stl_path = output_path.with_suffix(".stl")
    mesher = BRepMesh_IncrementalMesh(shape, linear_deflection, False, 0.35, True)
    mesher.Perform()
    if not mesher.IsDone():
        raise RuntimeError("Open Cascade tessellation failed")
    writer = StlAPI_Writer()
    writer.ASCIIMode = False
    if not writer.Write(shape, str(stl_path)):
        raise RuntimeError("Open Cascade STL export failed")
    mesh = trimesh.load_mesh(stl_path, process=False)
    mesh.export(output_path, file_type="glb")
    bounds = mesh.bounds.tolist()
    stats = {
        "source": str(step_path),
        "glb": str(output_path),
        "stl": str(stl_path),
        "vertices": int(len(mesh.vertices)),
        "triangles": int(len(mesh.faces)),
        "bounds": bounds,
        "extents": mesh.extents.tolist(),
    }
    return stats


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=Path, required=True)
    parser.add_argument("--component", type=Path, required=True)
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--glb", type=Path, required=True)
    parser.add_argument("--stats", type=Path, required=True)
    parser.add_argument("--linear-deflection", type=float, default=0.01)
    args = parser.parse_args()

    inventory, _shape = audit_assembly(args.assembly)
    args.inventory.parent.mkdir(parents=True, exist_ok=True)
    args.inventory.write_text(json.dumps(inventory, indent=2) + "\n")
    stats = export_glb(args.component, args.glb, args.linear_deflection)
    args.stats.write_text(json.dumps(stats, indent=2) + "\n")
    print(json.dumps({
        "free_shapes": inventory["free_shape_count"],
        "instances": inventory["component_instance_count"],
        "unique_definitions": inventory["unique_definition_count"],
        "placed_instances": inventory["placed_instance_count"],
        "mesh": stats,
    }, indent=2))


if __name__ == "__main__":
    main()
