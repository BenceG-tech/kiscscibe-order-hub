import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  rolesLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canViewOrders: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isAdminState, setIsAdminState] = useState(false);
  const [isStaffState, setIsStaffState] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    // Prevent parallel fetches from getSession + onAuthStateChange
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setRolesLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error fetching profile:', error);
        // Don't return early — still check roles below
      }

      setProfile(data || null);
      
      // Bootstrap first admin if needed
      if (data) {
        try {
          await supabase.rpc('bootstrap_first_admin');
        } catch (e) {
          console.error('[Auth] bootstrap_first_admin error:', e);
        }
      }
      
      // Check admin status from secure user_roles table via RPC
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) console.error('[Auth] is_admin RPC error:', adminError);
      setIsAdminState(isAdminResult === true);

      // Check staff status from secure user_roles table via RPC
      const { data: isStaffResult, error: staffError } = await supabase.rpc('is_staff');
      if (staffError) console.error('[Auth] is_staff RPC error:', staffError);
      setIsStaffState(isStaffResult === true);

      console.log(`[Auth] Roles determined: admin=${isAdminResult === true}, staff=${isStaffResult === true}`);
    } catch (error) {
      console.error('[Auth] Error in fetchProfile:', error);
    } finally {
      setRolesLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Set rolesLoading immediately before async fetch
          setRolesLoading(true);
          // Use setTimeout to avoid blocking, but rolesLoading is already true
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdminState(false);
          setIsStaffState(false);
          setRolesLoading(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRolesLoading(true);
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Role flags from secure user_roles table (no client-side fallbacks)
  const isAdmin = isAdminState;
  const isStaff = isStaffState;
  const canViewOrders = isAdminState || isStaffState;

  const value = {
    user,
    session,
    profile,
    loading,
    rolesLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isStaff,
    canViewOrders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
