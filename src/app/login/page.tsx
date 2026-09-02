import Image from 'next/image';
import { LoginForm } from './LoginForm';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="login">
      <div className="login-l">
        <div className="login-head">
          <div className="tilebox">
            <Image className="tile" src="/logo-tf.png" alt="Tanoto Foundation" width={56} height={56} />
          </div>
          <div className="rule" />
          <div>
            <div className="mark">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <rect x="1" y="13" width="4.6" height="11" rx="1.2" fill="#C9BC8A" />
                <rect x="7.5" y="7" width="4.6" height="17" rx="1.2" fill="#B3A369" />
                <rect x="14" y="10" width="4.6" height="14" rx="1.2" fill="#D8A657" />
                <rect x="20.5" y="3" width="4.6" height="21" rx="1.2" fill="#8A7A3E" />
              </svg>
              <span className="wm">FIND</span>
            </div>
            <div className="sub">Field Insights &amp; Notes Dashboard</div>
          </div>
        </div>

        <div className="login-body">
          <h1>Jadikan setiap kunjungan lapangan<br />sumber insight untuk perubahan.</h1>
          <p>Satu ruang kerja terintegrasi untuk menangkap, menilai, dan mensintesis temuan lapangan menjadi bukti yang bermakna. Platform ini memisahkan fakta dari interpretasi, menilai kualitas bukti secara otomatis, dan membantu menghasilkan insight yang lebih cepat untuk evaluasi, pengambilan keputusan, dan pembelajaran program.</p>
        </div>

        <div className="login-foot">© {new Date().getFullYear()} MLE Tanoto Foundation · v{APP_VERSION}</div>
      </div>

      <div className="login-r"><LoginForm /></div>
    </div>
  );
}
