import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Cloud,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { flushCloudSync, hydrateFromRemote } from '@/lib/cloud-sync';
import { pageContainer, pageSection } from '@/app/components/motion-variants';
import type { FinancialProfile, StorageMode } from '@/lib/types';

type StatusKind = 'info' | 'success' | 'warn' | 'error';
interface StatusMessage {
  kind: StatusKind;
  text: string;
}

const EXPORT_KEYS: (keyof FinancialProfile)[] = [
  'onboarded',
  'income',
  'expenses',
  'debts',
  'savings',
  'investments',
  'emergencyFund',
  'goals',
  'currency',
  'strategy',
  'monthlySurplusReserve',
  'lastUpdated',
  'stepUpEnabled',
  'investmentReturnRate',
  'storageMode',
];

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const storageMode = useFinPathStore((s) => s.storageMode);
  const lastUpdated = useFinPathStore((s) => s.lastUpdated);
  const onboarded = useFinPathStore((s) => s.onboarded);
  const ageYears = useFinPathStore((s) => s.ageYears);
  const setAgeYears = useFinPathStore((s) => s.setAgeYears);
  const setStorageMode = useFinPathStore((s) => s.setStorageMode);
  const replaceProfile = useFinPathStore((s) => s.replaceProfile);

  const user = useAuthStore((s) => s.user);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [busy, setBusy] = useState<null | 'switch' | 'push' | 'pull' | 'import'>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCloud = storageMode === 'cloud';

  const handleModeChange = async (next: StorageMode) => {
    if (next === storageMode) return;
    if (next === 'cloud' && !user) {
      setStatus({
        kind: 'warn',
        text: 'Sign in first to enable cloud sync.',
      });
      return;
    }

    setBusy('switch');
    setStorageMode(next);

    if (next === 'cloud') {
      // Force-push current local profile so the cloud row exists with current data.
      const ok = await flushCloudSync({ force: true });
      setStatus(
        ok
          ? {
              kind: 'success',
              text: 'Cloud sync enabled. Profile pushed.',
            }
          : {
              kind: 'warn',
              text: 'Cloud sync enabled, but initial push failed. Check that the backend is reachable.',
            },
      );
    } else {
      setStatus({
        kind: 'info',
        text: 'Cloud sync disabled. Profile lives in this browser only.',
      });
    }
    setBusy(null);
  };

  const handlePushNow = async () => {
    setBusy('push');
    const ok = await flushCloudSync({ force: true });
    setStatus(
      ok
        ? { kind: 'success', text: 'Pushed local profile to cloud.' }
        : { kind: 'error', text: 'Push failed. Check backend logs.' },
    );
    setBusy(null);
  };

  const handlePullNow = async () => {
    setBusy('pull');
    const result = await hydrateFromRemote();
    const map: Record<typeof result, StatusMessage> = {
      'no-auth': { kind: 'warn', text: 'Sign in to pull from cloud.' },
      'no-remote': {
        kind: 'info',
        text: 'No remote profile yet — nothing to pull.',
      },
      'remote-newer': {
        kind: 'success',
        text: 'Remote was newer. Local profile replaced.',
      },
      'local-newer': {
        kind: 'info',
        text: 'Local is newer than remote. No change.',
      },
      equal: { kind: 'info', text: 'Local and remote are in sync.' },
      error: { kind: 'error', text: 'Pull failed. Check backend logs.' },
    };
    setStatus(map[result]);
    setBusy(null);
  };

  const handleExport = () => {
    const state = useFinPathStore.getState();
    const payload: Record<string, unknown> = { schemaVersion: 5 };
    for (const key of EXPORT_KEYS) {
      payload[key as string] = (state as any)[key];
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`finpath-export-${stamp}.json`, payload);
    setStatus({ kind: 'success', text: 'Profile exported.' });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy('import');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Import file is not a JSON object.');
      }

      const local = useFinPathStore.getState();
      const incomingTs = Number(parsed.lastUpdated || 0);
      const localTs = Number(local.lastUpdated || 0);
      if (localTs > incomingTs) {
        const ok = window.confirm(
          'Your current profile is newer than the import file. Replace anyway?',
        );
        if (!ok) {
          setStatus({ kind: 'info', text: 'Import cancelled.' });
          setBusy(null);
          return;
        }
      }

      const next: Partial<FinancialProfile> = {};
      for (const key of EXPORT_KEYS) {
        if (key in parsed) (next as any)[key] = parsed[key as string];
      }
      // Preserve current storageMode unless the file explicitly overrides.
      if (!('storageMode' in parsed)) next.storageMode = storageMode;

      replaceProfile(next);

      if (next.storageMode === 'cloud' && user) {
        await flushCloudSync({ force: true });
      }
      setStatus({ kind: 'success', text: 'Profile imported.' });
    } catch (e: any) {
      setStatus({
        kind: 'error',
        text: `Import failed: ${e?.message || 'invalid JSON'}`,
      });
    } finally {
      setBusy(null);
    }
  };

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleString() : '—';

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto pb-12"
    >
      <motion.div variants={pageSection} className="mb-6">
        <h1 className="text-display" style={{ color: 'var(--foreground)' }}>
          Settings
        </h1>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-1)',
          }}
        >
          Manage where your profile lives and move data in or out.
        </p>
      </motion.div>

      {status && (
        <motion.div
          variants={pageSection}
          className="bento-card mb-4"
          style={{
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            borderColor:
              status.kind === 'error'
                ? 'var(--red)'
                : status.kind === 'warn'
                  ? 'var(--amber)'
                  : status.kind === 'success'
                    ? 'var(--green)'
                    : 'var(--border)',
          }}
        >
          {status.kind === 'error' || status.kind === 'warn' ? (
            <AlertTriangle
              size={18}
              className="icon-wireframe"
              style={{
                color: status.kind === 'error' ? 'var(--red)' : 'var(--amber)',
              }}
            />
          ) : (
            <CheckCircle2
              size={18}
              className="icon-wireframe"
              style={{
                color: status.kind === 'success' ? 'var(--green)' : 'var(--accent)',
              }}
            />
          )}
          <span
            style={{
              color: 'var(--card-foreground)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {status.text}
          </span>
        </motion.div>
      )}

      {/* Profile */}
      <motion.section
        variants={pageSection}
        className="bento-card mb-4"
        style={{ padding: 'var(--space-4)' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-1)',
          }}
        >
          <User size={16} className="icon-wireframe" style={{ color: 'var(--accent)' }} />
          <h2 className="text-heading" style={{ color: 'var(--card-foreground)' }}>
            Profile
          </h2>
        </div>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Used to personalise loan tenure caps and affordability advice.
        </p>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="settings-age"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--secondary)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-widest-sm)',
              }}
            >
              Your age
            </label>
            <input
              id="settings-age"
              type="number"
              min={18}
              max={70}
              placeholder="e.g. 28"
              value={ageYears ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setAgeYears(!isNaN(v) && v >= 18 && v <= 70 ? v : undefined);
              }}
              style={{
                width: 100,
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-tint)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
            />
          </div>
          {ageYears && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)', marginTop: 20 }}>
              Max EMI tenure capped at{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                {Math.max(0, 60 - ageYears) * 12} months
              </strong>{' '}
              (retirement at 60).
            </p>
          )}
        </div>
      </motion.section>

      {/* Appearance */}
      <motion.section
        variants={pageSection}
        className="bento-card mb-4"
        style={{ padding: 'var(--space-4)' }}
      >
        <h2 className="text-heading" style={{ color: 'var(--card-foreground)' }}>
          Appearance
        </h2>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-1)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Pick how the app should look. Stored in this browser.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-2)',
          }}
        >
          {(['dark', 'light'] as ThemeMode[]).map((m) => {
            const active = themeMode === m;
            const Icon = m === 'dark' ? Moon : Sun;
            return (
              <button
                key={m}
                onClick={() => setThemeMode(m)}
                className="card-hover"
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-subtle)' : 'var(--surface-tint)',
                  color: active ? 'var(--accent-text)' : 'var(--card-foreground)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <Icon size={18} className="icon-wireframe" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    {m === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--secondary)',
                  }}
                >
                  {m === 'dark' ? 'Easier on the eyes at night.' : 'Higher contrast in daylight.'}
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Storage mode */}
      <motion.section
        variants={pageSection}
        className="bento-card mb-4"
        style={{ padding: 'var(--space-4)' }}
      >
        <h2 className="text-heading" style={{ color: 'var(--card-foreground)' }}>
          Storage
        </h2>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-1)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <span className="font-semibold">Local</span> keeps your profile in this browser only.{' '}
          <span className="font-semibold">Cloud</span> additionally syncs to Supabase so you can
          sign in from another browser or device.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-2)',
          }}
        >
          <button
            onClick={() => handleModeChange('local')}
            disabled={busy !== null}
            className="card-hover"
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${!isCloud ? 'var(--accent)' : 'var(--border)'}`,
              background: !isCloud ? 'var(--accent-subtle)' : 'var(--surface-tint)',
              color: !isCloud ? 'var(--accent-text)' : 'var(--card-foreground)',
              textAlign: 'left',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy && busy !== 'switch' ? 0.6 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <HardDrive size={18} className="icon-wireframe" />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Local only</span>
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--secondary)',
              }}
            >
              Stays in localStorage. Export to back up.
            </span>
          </button>

          <button
            onClick={() => handleModeChange('cloud')}
            disabled={busy !== null}
            className="card-hover"
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isCloud ? 'var(--accent)' : 'var(--border)'}`,
              background: isCloud ? 'var(--accent-subtle)' : 'var(--surface-tint)',
              color: isCloud ? 'var(--accent-text)' : 'var(--card-foreground)',
              textAlign: 'left',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy && busy !== 'switch' ? 0.6 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <Cloud size={18} className="icon-wireframe" />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Cloud sync</span>
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--secondary)',
              }}
            >
              Mirrors to Supabase. Syncs across devices.
            </span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handlePushNow}
            disabled={!isCloud || !user || busy !== null}
            className="pill-button"
            style={{
              opacity: !isCloud || !user || busy !== null ? 0.5 : 1,
              cursor: !isCloud || !user || busy ? 'not-allowed' : 'pointer',
            }}
          >
            <Upload size={14} className="icon-wireframe" />
            <span>{busy === 'push' ? 'Pushing…' : 'Push local → cloud'}</span>
          </button>
          <button
            onClick={handlePullNow}
            disabled={!user || busy !== null}
            className="pill-button"
            style={{
              opacity: !user || busy !== null ? 0.5 : 1,
              cursor: !user || busy ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className="icon-wireframe" />
            <span>{busy === 'pull' ? 'Pulling…' : 'Pull cloud → local'}</span>
          </button>
        </div>

        <div
          style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--border)',
            fontSize: 'var(--text-xs)',
            color: 'var(--secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-1)',
          }}
        >
          <span>
            Mode: <strong>{storageMode}</strong>
          </span>
          <span>Last updated: {lastUpdatedLabel}</span>
          <span>User: {user?.email || 'not signed in'}</span>
        </div>
      </motion.section>

      {/* Export / Import */}
      <motion.section
        variants={pageSection}
        className="bento-card"
        style={{ padding: 'var(--space-4)' }}
      >
        <h2 className="text-heading" style={{ color: 'var(--card-foreground)' }}>
          Backup &amp; restore
        </h2>
        <p
          style={{
            color: 'var(--secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-1)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Export a JSON snapshot to back up locally. Import to restore — if the file is older than
          your current data, you'll be asked to confirm.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleExport}
            disabled={!onboarded || busy !== null}
            className="pill-button"
            style={{
              opacity: !onboarded || busy !== null ? 0.5 : 1,
              cursor: !onboarded || busy ? 'not-allowed' : 'pointer',
            }}
          >
            <Download size={14} className="icon-wireframe" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleImportClick}
            disabled={busy !== null}
            className="pill-button"
            style={{
              opacity: busy !== null ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            <Upload size={14} className="icon-wireframe" />
            <span>{busy === 'import' ? 'Importing…' : 'Import JSON'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </motion.section>
    </motion.div>
  );
}
