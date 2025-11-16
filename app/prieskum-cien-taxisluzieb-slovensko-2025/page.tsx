/** Redirect z starej URL na novú */

import { redirect } from 'next/navigation';

export default function PrieskumRedirect() {
  redirect('/porovnanie-cien-taxi-2024-2025');
}
