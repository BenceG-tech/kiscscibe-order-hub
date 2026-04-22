import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { user, signIn, signUp, signOut, isAdmin, isStaff, loading: authLoading, rolesLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated - wait for roles to load
  useEffect(() => {
    if (user && !authLoading && !rolesLoading) {
      if (from !== '/' && from !== '/auth') {
        navigate(from, { replace: true });
      } else if (isAdmin) {
        navigate('/admin/orders', { replace: true });
      } else if (isStaff) {
        navigate('/staff/orders', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, rolesLoading, isAdmin, isStaff, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    
    if (result.error) {
      setError(result.error.message);
    } else if (mode === 'signup') {
      setMessage('Regisztráció elindítva. Ha szükséges, erősítsd meg az email címedet, majd jelentkezz be.');
    }
    
    setIsLoading(false);
  };

  // Timeout: if loading takes too long, offer escape options
  useEffect(() => {
    if (user || authLoading || rolesLoading) {
      const timer = setTimeout(() => setLoadingTooLong(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTooLong(false);
    }
  }, [user, authLoading, rolesLoading]);

  // Show loading while checking auth or roles
  if (user || authLoading || rolesLoading) {
    if (loadingTooLong) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
          <LoadingSpinner className="w-8 h-8" />
          <p className="text-sm text-muted-foreground">Betöltés folyamatban...</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Újra próbálom
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await signOut();
                setLoadingTooLong(false);
              }}
            >
              Kijelentkezés
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Vissza
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{mode === 'signin' ? 'Belépés' : 'Admin regisztráció'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              {mode === 'signup' && (
                <Alert>
                  <AlertDescription>
                    Admin fiókot csak az előre engedélyezett email címek kapnak. Más emaillel létrejöhet fiók, de nem lesz admin hozzáférés.
                  </AlertDescription>
                </Alert>
              )}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Név</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Teljes név"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email cím</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Jelszó</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="w-4 h-4" /> : mode === 'signin' ? 'Belépés' : 'Regisztráció'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                  setMessage('');
                }}
              >
                {mode === 'signin' ? 'Admin regisztráció' : 'Már van fiókom — belépés'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
