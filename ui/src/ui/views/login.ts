import { html } from "lit";

export type LoginProps = {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  rateLimitCountdown: number | null;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onClearError: () => void;
};

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${remainingSeconds}s`;
}

export function renderLogin(props: LoginProps) {
  const {
    email,
    password,
    isLoading,
    error,
    rateLimitCountdown,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onClearError,
  } = props;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSubmit();
  };

  return html`
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>OpenClaw</h1>
          <p class="subtitle">Control UI</p>
        </div>

        <form @submit=${handleSubmit} class="login-form">
          ${
            error
              ? html`
                <div class="error-message">
                  <span class="error-icon">⚠️</span>
                  <span class="error-text">${error}</span>
                  <button
                    type="button"
                    class="error-close"
                    @click=${onClearError}
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              `
              : null
          }

          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                .value=${email}
                @input=${(e: InputEvent) => onEmailChange((e.target as HTMLInputElement).value)}
                placeholder="admin@example.com"
                required
                autocomplete="email"
                ?disabled=${isLoading || rateLimitCountdown !== null}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                type="password"
                id="password"
                name="password"
                .value=${password}
                @input=${(e: InputEvent) => onPasswordChange((e.target as HTMLInputElement).value)}
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                ?disabled=${isLoading || rateLimitCountdown !== null}
              />
            </div>
          </div>

          <button
            type="submit"
            class="login-button"
            ?disabled=${isLoading || rateLimitCountdown !== null || !email || !password}
          >
            ${
              isLoading
                ? html`
                    <span class="spinner"></span> Signing in...
                  `
                : rateLimitCountdown !== null
                  ? html`Retry in ${formatCountdown(rateLimitCountdown)}`
                  : "Sign In"
            }
          </button>
        </form>
      </div>
    </div>

    <style>
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        background: var(--bg-secondary, #f5f5f5);
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 40px;
        background: var(--bg-primary, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .login-header h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary, #111111);
      }

      .subtitle {
        margin: 0;
        font-size: 16px;
        color: var(--text-secondary, #666666);
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--error-bg, #fef2f2);
        border: 1px solid var(--error-border, #fecaca);
        border-radius: 8px;
        color: var(--error-text, #dc2626);
      }

      .error-icon {
        flex-shrink: 0;
      }

      .error-text {
        flex: 1;
        font-size: 14px;
      }

      .error-close {
        background: none;
        border: none;
        font-size: 18px;
        color: var(--error-text, #dc2626);
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }

      .error-close:hover {
        opacity: 0.7;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-group label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #111111);
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 12px;
        font-size: 16px;
        opacity: 0.5;
      }

      .input-wrapper input {
        width: 100%;
        padding: 10px 12px 10px 40px;
        font-size: 14px;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 8px;
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #111111);
        transition: border-color 0.15s ease;
      }

      .input-wrapper input:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .input-wrapper input:disabled {
        background: var(--bg-disabled, #f3f4f6);
        cursor: not-allowed;
      }

      .login-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        color: white;
        background: var(--primary-color, #3b82f6);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.15s ease;
        margin-top: 8px;
      }

      .login-button:hover:not(:disabled) {
        background: var(--primary-hover, #2563eb);
      }

      .login-button:disabled {
        background: var(--bg-disabled, #d1d5db);
        cursor: not-allowed;
      }

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  `;
}
