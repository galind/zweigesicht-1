import { redirect } from 'next/navigation';

/** Keep shared prototype links pointing at the canonical workshop. */
export default function PrototypePage() {
  redirect('/workshop');
}
