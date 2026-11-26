import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ChevronDown, Gamepad2, Plus } from 'lucide-react';
import { DEFAULT_REGISTRATION_AVATAR, REGISTRATION_AVATAR_LIMIT, isAdultBirthDate, isValidNickname } from '@shared/registration';
import { businessApi, type RegistrationProfile, type WelcomeResult } from '../../services/businessApi';
import { useApp } from '../../app/AppContext';
import { BirthDatePicker } from './BirthDatePicker';
import { AvatarCropDialog } from './AvatarCropDialog';
import { GoogleEntry } from './GoogleEntry';
import { welcomeCopy } from './welcomeCopy';
import './welcomeAuth.css';

const countries = 'SA AE KW QA BH OM EG JO IQ LB PS YE SY TR IR IL MA DZ TN LY SD'.split(' ');
const photoTypes = new Map([['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['webp', 'image/webp']]);
const acceptedPhotos = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
type Screen = 'welcome' | 'email' | 'code' | 'profile';
type Continuation = Extract<WelcomeResult, { ticket: string }>;
type ErrorLabel = 'invalidCode' | 'expired' | 'mailUnavailable' | 'cooldown' | 'invalidProfile' |
  'accountUnavailable' | 'googleUnavailable' | 'choosePhoto' | 'avatarUploadFailed' | 'failed';
const errorCopy: Record<string, ErrorLabel> = {
  AUTH_EMAIL_CODE_INVALID: 'invalidCode', AUTH_PROOF_EXPIRED: 'expired', AUTH_ACCOUNT_CHANGED: 'expired',
  AUTH_MAIL_UNAVAILABLE: 'mailUnavailable', AUTH_EMAIL_CODE_COOLDOWN: 'cooldown',
  AUTH_PROFILE_INVALID: 'invalidProfile', AUTH_AVATAR_REQUIRED: 'avatarUploadFailed',
  AUTH_ACCOUNT_UNAVAILABLE: 'accountUnavailable', AUTH_GOOGLE_INVALID: 'googleUnavailable',
  AUTH_GOOGLE_UNAVAILABLE: 'googleUnavailable', AUTH_AVATAR_INVALID: 'choosePhoto',
};

function Brand() {
  return <div className="wa-brand"><Gamepad2 aria-hidden="true" /><strong dir="ltr">Le3eb</strong></div>;
}

export function WelcomeAuth() {
  const { locale, deviceId, enterFromWelcome } = useApp();
  const language = locale === 'ar' ? 'ar' : 'en';
  const copy = welcomeCopy[language];
  const [screen, setScreen] = useState<Screen>('welcome');
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState({ email: '', until: 0 });
  const [seconds, setSeconds] = useState(0);
  const [pending, setPending] = useState<Continuation | null>(null);
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<RegistrationProfile['gender'] | ''>('');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const dateTrigger = useRef<HTMLButtonElement>(null);
  const genderDialog = useRef<HTMLDialogElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoToCrop, setPhotoToCrop] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<ErrorLabel | null>(null);

  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((cooldown.until - Date.now()) / 1000)));
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [cooldown]);
  useEffect(() => {
    if (!photo) { setPhotoUrl(''); return; }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const move = (next: Screen) => { setError(null); setScreen(next); };
  const start = (isRegistration: boolean) => {
    setRegister(isRegistration);
    setPending(null);
    move('email');
  };
  const perform = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try { await action(); } catch (reason) {
      setError(errorCopy[reason instanceof Error ? reason.message : ''] ?? 'failed');
    } finally { inFlight.current = false; setBusy(false); }
  };
  const sendCode = async (address: string) => {
    const normalized = address.trim().toLowerCase();
    if (normalized !== cooldown.email || Date.now() >= cooldown.until) {
      const result = await businessApi.sendEmailCode(normalized, 'login', deviceId || undefined);
      setCooldown({ email: normalized, until: Date.now() + result.cooldownSec * 1000 });
      setSeconds(result.cooldownSec);
      setCode('');
    }
    setEmail(normalized);
    move('code');
  };
  const continueWith = async (result: WelcomeResult) => {
    if (result.kind === 'session') { enterFromWelcome(result.session); return; }
    setEmail(result.email);
    setPending(result);
    if (result.kind === 'confirm-google') {
      setCode('');
      move('code');
      await sendCode(result.email);
      return;
    }
    setPhoto(null);
    setPhotoToCrop(null);
    setUsername('');
    setGender('');
    setCountry('');
    setBirthDate('');
    move('profile');
  };
  const submit = (event: FormEvent, action: () => Promise<void>) => {
    event.preventDefault();
    void perform(action);
  };
  const finish = async () => {
    if (!pending || !gender || !country || !isValidNickname(username) || !isAdultBirthDate(birthDate)) {
      setError('invalidProfile');
      return;
    }
    if (photo) {
      try {
        await businessApi.uploadRegistrationAvatar(pending.ticket, photo);
      } catch (reason) {
        const key = reason instanceof Error ? reason.message : '';
        setError(errorCopy[key] ?? 'avatarUploadFailed');
        return;
      }
    }
    enterFromWelcome(await businessApi.completeWelcomeRegistration(
      pending.ticket, { username, gender, country, birthDate }, !photo, deviceId || undefined,
    ));
  };
  const choosePhoto = (file?: File) => {
    if (!file) return;
    const type = file.type || photoTypes.get(file.name.split('.').pop()?.toLowerCase() ?? '');
    if (!type || ![...photoTypes.values()].includes(type) || file.size === 0 || file.size > REGISTRATION_AVATAR_LIMIT) {
      setError('choosePhoto');
      return;
    }
    setError(null);
    setPhotoToCrop(file.type ? file : new File([file], file.name, { type }));
  };
  const dateClose = () => { setDateOpen(false); dateTrigger.current?.focus(); };
  const back = () => {
    setPending(null);
    setCode('');
    move(screen === 'email' ? 'welcome' : 'email');
  };
  const countryNames = new Intl.DisplayNames([language], { type: 'region' });
  const resendSeconds = cooldown.email === email ? seconds : 0;
  const displayDate = birthDate && new Intl.DateTimeFormat(language, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(birthDate + 'T00:00:00Z'));

  return <main className="welcome-auth" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <div className="wa-panel">
    {screen === 'welcome' ? <>
      <div className="wa-hero">
        <Brand />
        <div className="wa-hero-icon"><Gamepad2 aria-hidden="true" /></div>
        <h1>{copy.welcome}</h1>
        <p className="wa-muted">{copy.tagline}</p>
      </div>
      <div className="wa-stack wa-entry-buttons">
        <button className="wa-primary" onClick={() => start(false)}>{copy.login}</button>
        <button className="wa-secondary" onClick={() => start(true)}>{copy.register}</button>
      </div>
    </> : <>
      <header className="wa-header">
        <button type="button" className="wa-back" onClick={back} disabled={busy} aria-label={copy.back}><ArrowLeft /></button>
        <Brand />
      </header>
      {screen === 'email' && <>
        <h1>{register ? copy.register : copy.login}</h1>
        <form className="wa-stack wa-email" onSubmit={event => submit(event, () => sendCode(email))}>
          <label>{copy.email} <span className="wa-required">*</span>
            <input type="email" dir="ltr" autoComplete="email" maxLength={254} value={email}
              onChange={event => setEmail(event.target.value)} placeholder="player@example.com" required />
          </label>
          <button className="wa-primary" disabled={busy}>{busy ? copy.waiting : copy.send}</button>
        </form>
        <div className="wa-or">{copy.or}</div>
        <GoogleEntry language={language} unavailable={copy.googleUnavailable} busy={busy}
          onCredential={(credential, nonce) => void perform(async () => {
            await continueWith(await businessApi.confirmGoogleAuth(credential, nonce, deviceId || undefined));
          })} />
        <p className="wa-switch">{register ? copy.existing : copy.newHere}{' '}
          <button type="button" className="wa-link" disabled={busy} onClick={() => start(!register)}>
            {register ? copy.login : copy.register}
          </button>
        </p>
      </>}
      {screen === 'code' && <>
        <h1>{copy.verifyTitle}</h1>
        <p className="wa-muted">{pending?.kind === 'confirm-google' ? copy.googleConfirm : copy.sent}</p>
        <p className="wa-email-line"><b dir="ltr">{email}</b>
          {pending?.kind !== 'confirm-google' && <button type="button" className="wa-link" disabled={busy} onClick={back}>{copy.edit}</button>}
        </p>
        <form className="wa-stack" onSubmit={event => submit(event, async () => {
          await continueWith(await businessApi.confirmWelcomeEmail(email, code, deviceId || undefined,
            pending?.kind === 'confirm-google' ? pending.ticket : undefined));
        })}>
          <div className="wa-code-wrap" dir="ltr">
            <div className="wa-code-boxes" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <span key={i}>{code[i] || '·'}</span>)}
            </div>
            <input aria-label={copy.code} inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6}
              autoFocus onChange={event => setCode(event.target.value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16)).replace(/\D/g, ''))} />
          </div>
          <button className="wa-primary" disabled={busy || code.length !== 6}>{busy ? copy.waiting : copy.verify}</button>
        </form>
        <p className="wa-switch">{copy.noCode}{' '}
          <button className="wa-link" type="button" disabled={busy || resendSeconds > 0} onClick={() => void perform(() => sendCode(email))}>
            {copy.resend}{resendSeconds > 0 && <span dir="ltr"> {String(Math.floor(resendSeconds / 60)).padStart(2, '0')}:{String(resendSeconds % 60).padStart(2, '0')}</span>}
          </button>
        </p>
      </>}
      {screen === 'profile' && <>
        <h1>{copy.profile}</h1>
        <form className="wa-stack" onSubmit={event => {
          event.preventDefault();
          setError(null);
          genderDialog.current?.showModal();
        }} inert={dateOpen}>
          <div className="wa-avatar">
            <button type="button" className="wa-avatar-disc" aria-label={copy.chooseOrChangePhoto}
              onClick={() => photoInput.current?.click()} disabled={busy}>
              <img src={photoUrl || DEFAULT_REGISTRATION_AVATAR} alt="" />
              <span className="wa-avatar-add"><Plus aria-hidden="true" /></span>
            </button>
            <b>{copy.photo}</b>
            <input type="file" hidden ref={photoInput} aria-label={copy.photo} accept={acceptedPhotos}
              disabled={busy} onChange={event => {
                choosePhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }} />
            {photo && <button className="wa-link" type="button" disabled={busy}
              onClick={() => { setPhoto(null); setError(null); }}>{copy.removePhoto}</button>}
          </div>
          <label>{copy.nickname}
            <input className="laeeb-nickname" value={username} onChange={event => setUsername(event.target.value)} autoComplete="nickname"
              maxLength={128} dir="auto" placeholder={copy.nicknameHint} aria-describedby="wa-nickname-rule"
              aria-invalid={username.length > 0 && !isValidNickname(username)} required />
            <span id="wa-nickname-rule" className="sr-only">{copy.nicknameRule}</span>
          </label>
            <label>{copy.gender} <span className="wa-required">*</span>
              <span className="wa-select-wrap">
                <select value={gender} onChange={event => setGender(event.target.value as typeof gender)} required>
                  <option value="" disabled>{copy.select}</option><option value="M">{copy.male}</option>
                  <option value="F">{copy.female}</option>
                </select><ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label>{copy.region} <span className="wa-required">*</span>
              <span className="wa-select-wrap">
                <select value={country} onChange={event => setCountry(event.target.value)} autoComplete="country" required>
                  <option value="">{copy.select}</option>
                  {countries.map(item => <option value={item} key={item}>{countryNames.of(item)}</option>)}
                  <option value="ZZ">{copy.otherRegion}</option>
                </select><ChevronDown aria-hidden="true" />
              </span>
            </label>
          <div>
            <div id="wa-birth-label">{copy.birth} <span className="wa-required">*</span></div>
            <button className="wa-date-trigger" type="button" ref={dateTrigger} aria-labelledby="wa-birth-label wa-birth-value"
              aria-haspopup="dialog" onClick={() => setDateOpen(true)} disabled={busy}>
              <span id="wa-birth-value">{displayDate || copy.pickDate}</span><ChevronDown aria-hidden="true" />
            </button>
            <p className="wa-muted wa-adult">{copy.adult}</p>
          </div>
          <button className="wa-primary" disabled={busy || !isValidNickname(username) || !gender || !country || !birthDate}>
            {busy ? copy.waiting : copy.finish}
          </button>
        </form>
        <dialog ref={genderDialog} className="wa-gender-dialog" aria-labelledby="wa-gender-confirm">
          <h2 id="wa-gender-confirm">{copy.confirmGender}</h2>
          <p className="wa-gender-value">{gender === 'M' ? copy.male : copy.female}</p>
          <p className="wa-muted">{copy.confirmGenderNote}</p>
          <div className="wa-stack wa-confirm-actions">
            <button className="wa-primary" type="button" onClick={() => {
              genderDialog.current?.close();
              void perform(finish);
            }}>{copy.confirmProfile}</button>
            <button className="wa-secondary" type="button" autoFocus
              onClick={() => genderDialog.current?.close()}>{copy.editProfile}</button>
          </div>
        </dialog>
        {dateOpen && <BirthDatePicker copy={copy} language={language} value={birthDate} onClose={dateClose}
          onConfirm={value => { setBirthDate(value); dateClose(); }} />}
        {photoToCrop && <AvatarCropDialog file={photoToCrop} copy={copy}
          onCancel={() => setPhotoToCrop(null)}
          onApply={cropped => { setPhoto(cropped); setPhotoToCrop(null); }} />}
      </>}
      {error && <p className="wa-error" role="alert">{copy[error]}</p>}
    </>}
    </div>
  </main>;
}
