#!/usr/bin/env python3
"""Shared XCAF source loading and identity helpers for CAD reproduction."""

from __future__ import annotations

from pathlib import Path

from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_AsciiString, TCollection_ExtendedString
from OCP.TDataStd import TDataStd_Name
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.TDocStd import TDocStd_Document
from OCP.TopLoc import TopLoc_Location
from OCP.XCAFDoc import XCAFDoc_DocumentTool


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
