'use client';
import { NoteForm, blankNote } from '@/components/NoteForm';
import { useNotes } from '@/components/NotesProvider';

export default function CatatanBaruPage() {
  const { profile } = useNotes();
  return <NoteForm initial={blankNote(profile.email)} isEdit={false} />;
}
