import { redirect } from 'next/navigation'

// Paperclip landing removed — the office floor is the home base now.
export default function AdminHome() {
  redirect('/admin/office')
}
