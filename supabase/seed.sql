-- ============================================================
-- Data contoh (opsional). Jalankan SETELAH schema.sql dan
-- setelah minimal satu akun dibuat lewat Supabase Auth.
-- Ganti alamat email di bawah dengan email akun Anda.
-- ============================================================
do $$
declare uid uuid;
begin
  select id into uid from public.profiles where email = 'ganti@tanotofoundation.org';
  if uid is null then
    raise notice 'Profil tidak ditemukan. Buat akun dulu di Authentication > Users, lalu sesuaikan email di berkas ini.';
    return;
  end if;

  insert into public.notes (author_id, status, judul, tgl_kegiatan, tgl_selesai, kabkota, kecdesa, institusi,
    email_tf, dept_level, dept_unit, program, jenis, pihak, tujuan, alasan, ringkasan, obs, rtl)
  values (
    uid, 'submitted',
    'Supervisi pengumpulan data baseline literasi kelas 2',
    '2026-08-11', '2026-08-13',
    'Kabupaten Kampar', 'Kecamatan Bangkinang', 'SDN 012 Bangkinang',
    (select email from public.profiles where id = uid), 'Nasional', 'MLE', 'PINTAR', 'Supervisi pengumpulan data',
    '[{"nama":"Hasnah","jabatan":"Kepala Sekolah","instansi":"SDN 012 Bangkinang"},
      {"nama":"Rudi Hartono","jabatan":"Enumerator","instansi":"Vendor survei"},
      {"nama":"Dewi Anggraini","jabatan":"Pengawas","instansi":"Dinas Pendidikan Kampar"}]'::jsonb,
    'Memastikan enumerator menerapkan protokol asesmen EGRA sesuai manual dan mengidentifikasi hambatan lapangan pada hari kedua pengumpulan data.',
    'Sekolah ini adalah lokasi dengan jumlah siswa terbesar di klaster Kampar dan menjadi tempat uji coba protokol asesmen versi revisi.',
    'Pengumpulan data baseline berjalan sesuai jadwal untuk 3 dari 4 kelas. Protokol asesmen dipatuhi pada aspek instruksi dan pencatatan waktu, namun ditemukan inkonsistensi dalam pemberian skor pada subtes membaca lisan. Sekolah kooperatif tetapi ruang asesmen berisik.',
    '{"pelaksanaan":{"f":"Asesmen dilakukan pada 68 dari 72 siswa kelas 2 yang terdaftar (4 siswa tidak hadir). 3 enumerator bertugas, masing-masing menyelesaikan rata-rata 23 siswa dalam 4 jam. Waktu per siswa tercatat 8-14 menit. Pada 6 pengamatan langsung subtes membaca lisan, 2 enumerator menghentikan pembacaan pada detik ke-60 sesuai manual, 1 enumerator melanjutkan hingga siswa menyelesaikan teks.","i":"Kepatuhan protokol tinggi pada aspek prosedural yang mudah diamati tetapi lemah pada aspek yang memerlukan penilaian saat itu juga. Data subtes membaca lisan dari 1 enumerator berpotensi tidak sebanding dengan yang lain."},
      "respons":{"f":"Kepala sekolah menyediakan 2 ruang kelas kosong tanpa diminta. Guru kelas 2 bertanya 3 kali kapan hasil asesmen dapat diketahui sekolah. Pengawas dinas hadir selama 1,5 jam.","i":"Ada permintaan yang belum terpenuhi atas umpan balik hasil asesmen. Jika tidak direspons, kesediaan sekolah pada gelombang berikutnya berisiko menurun."},
      "konteks":{"f":"Sekolah sedang mempersiapkan lomba kebersihan tingkat kecamatan pada minggu yang sama. Listrik padam 25 menit pada pukul 10.15.","i":"Kebisingan dari kegiatan paralel dapat diantisipasi lewat koordinasi jadwal sebelum kunjungan. Pemadaman listrik adalah risiko berulang yang perlu masuk daftar risiko operasional."}}'::jsonb,
    '[{"aksi":"Sesi penyegaran 60 menit untuk 3 enumerator tentang aturan penghentian subtes membaca lisan","pic":"Koordinator lapangan","target":"2026-08-18","status":"selesai"},
      {"aksi":"Verifikasi ulang skor membaca lisan 23 siswa yang diases oleh enumerator ketiga","pic":"Tim MLE","target":"2026-08-22","status":"berjalan"},
      {"aksi":"Kirim ringkasan 1 halaman hasil asesmen ke kepala sekolah dan Dinas Pendidikan Kampar","pic":"Sri Mulyani","target":"2026-09-05","status":"terbuka"}]'::jsonb
  );
end $$;
