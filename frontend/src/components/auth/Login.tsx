import React, { useState, useContext, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../../context/AuthContext';
import { LoginForm, LoginResponse } from '../../types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GoogleJwtPayload } from '../../types/auth';

const backendUrl = import.meta.env.VITE_BACKEND_URL;


const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleManualLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json() as LoginResponse;
      // login(data.key, { username: form.username });
      const profileRes = await fetch(`${backendUrl}/users/me/`, {
        headers: { Authorization: `Token ${data.key}` }
      });
      const profileData = await profileRes.json();
    
      // ✅ login 并包括 avatar
      login(data.key, {
        username: form.username,
        avatar: profileData.avatar // 👈 把 avatar 存进去
      });
      navigate("/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Failed to receive Google credentials");
      return;
    }

    const token = credentialResponse.credential;
    const decoded = jwtDecode<GoogleJwtPayload>(token);

    try {
      const res = await fetch(`${backendUrl}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        // login(data.token, data.user);
 
        const profileRes = await fetch(`${backendUrl}/users/me/`, {
          headers: { Authorization: `Token ${data.token}` }
        });
    
        const profileData = await profileRes.json();
    
        // ✅ 存储 token + avatar
        login(data.token, {
          username: profileData.user.username,
          avatar: profileData.avatar
        });
        navigate("/posts");
      } else {
        setError("Google authentication failed");
      }
    } catch (err) {
      console.error("Google login error", err);
      setError("Failed to process Google login");
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center  bg-white p-6 md:p-10">

      <div className="flex w-full max-w-sm flex-col gap-6 flex-1 justify-center">
        <div className="bg-card border rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-center text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Login with your Google account
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {/* Social Google */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>

          {/* Divider */}
          <div className="relative text-center text-sm mb-6 after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>

          {/* Manual Login */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={form.username} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="#" className="text-xs text-muted-foreground hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          {/* Error message */}
          {error && <p className="text-destructive mt-4 text-sm text-center">{error}</p>}

          {/* Footer */}
          <p className="text-center text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link className="underline underline-offset-4 hover:text-primary font-medium" to="/register">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4">Terms of Service</a> and{" "}
          <a href="#" className="underline underline-offset-4">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;