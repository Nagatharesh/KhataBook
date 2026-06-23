/**
 * js/pages/login.js — Auth Page (Sign In / Sign Up)
 */
import { supabaseClient } from '../lib/supabase.js';
import { toast } from '../components/toast.js';

export function renderLogin(root) {
  let isSignUp = false;

  function updateDOM() {
    root.innerHTML = `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-logo">₹</div>
          <h2 class="login-title">${isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p class="login-subtitle">${isSignUp ? 'Get started with your secure digital ledger' : 'Sign in to access your business ledger'}</p>

          <form id="auth-form" class="login-form">
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input type="password" id="password" class="form-input" placeholder="••••••••" required autocomplete="current-password" minlength="6" />
            </div>

            <button type="submit" class="btn btn-primary w-full justify-center mt-24" id="submit-btn">
              <span class="btn-text">${isSignUp ? 'Create Account' : 'Sign In'}</span>
              <span class="btn-loader spinner" style="display: none; width: 16px; height: 16px; border-width: 1.5px; border-top-color: var(--brand-text);"></span>
            </button>
          </form>

          <div class="login-switch">
            <span>${isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
            <button type="button" id="switch-mode-btn" class="switch-link">
              ${isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    const form = root.querySelector('#auth-form');
    const switchBtn = root.querySelector('#switch-mode-btn');
    const submitBtn = root.querySelector('#submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const emailInput = root.querySelector('#email');
    const passwordInput = root.querySelector('#password');

    switchBtn.addEventListener('click', () => {
      isSignUp = !isSignUp;
      updateDOM();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Enter loading state
      submitBtn.disabled = true;
      emailInput.disabled = true;
      passwordInput.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-block';

      try {
        if (isSignUp) {
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
          });
          if (error) throw error;
          
          if (data?.user?.identities?.length === 0) {
            // User already exists
            toast.error('An account with this email already exists.');
          } else {
            toast.success('Account created successfully! Logging in...');
          }
        } else {
          const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          toast.success('Successfully signed in');
        }
      } catch (err) {
        console.error('Auth Error:', err);
        toast.error(err.message || 'Authentication failed');
        
        // Re-enable inputs on failure
        submitBtn.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
      }
    });
  }

  updateDOM();
}
