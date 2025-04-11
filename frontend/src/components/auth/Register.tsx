import React, { useState, useEffect, ChangeEvent, FormEvent, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { RegisterForm, LoginResponse } from '../../types/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GalleryVerticalEnd, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils'; // Optional for cleaner class merging

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({ username: '', email: '', password1: '', password2: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    fetch('/csrf/', { method: 'GET', credentials: 'include' });
  }, []);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/auth/registration/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(Object.entries(data).map(([key, val]) => `${key}: ${val}`).join("\n"));

      const loginRes = await fetch("http://localhost:8000/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password1 }),
      });

      if (!loginRes.ok) throw new Error("Registered but failed to log in.");

      const loginData = await loginRes.json() as LoginResponse;
      login(loginData.key, { username: form.username });
      navigate("/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 flex-1 justify-center">
        <div className="bg-card border rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-center text-2xl font-bold mb-2">Create an account</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Start sharing your interview experiences
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username */}
            <div className="space-y-2 group">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Email */}
            <div className="space-y-2 group">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Password */}
            <div className="space-y-2 group relative">
              <Label htmlFor="password1">Password</Label>
              <Input
                id="password1"
                name="password1"
                type={showPassword ? "text" : "password"}
                value={form.password1}
                onChange={handleChange}
                required
                className="transition-all focus-visible:ring-2 focus-visible:ring-primary pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 group relative">
              <Label htmlFor="password2">Confirm Password</Label>
              <Input
                id="password2"
                name="password2"
                type={showPassword ? "text" : "password"}
                value={form.password2}
                onChange={handleChange}
                required
                className="transition-all focus-visible:ring-2 focus-visible:ring-primary pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full flex justify-center items-center gap-2" disabled={loading}>
              {loading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
              Register
            </Button>
          </form>

          {/* Error message */}
          {error && <p className="text-destructive mt-4 text-sm text-center whitespace-pre-line">{error}</p>}

          {/* Footer */}
          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link className="underline underline-offset-4 hover:text-primary font-medium" to="/login">
              Login here
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

export default Register;
