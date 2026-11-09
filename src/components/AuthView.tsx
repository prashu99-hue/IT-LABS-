import React, { useState } from 'react';
import {
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserRole, User } from '../types';
import {
  registerWithFirebase,
  loginWithFirebase,
  formatFirebaseAuthError
} from '../services/authService';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onAuthenticate: (user: User) => void;
  onCancel: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'register',
  onAuthenticate,
  onCancel,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [institution, setInstitution] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>(['Web Development']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableSubjects = [
    'Java',
    'Python',
    'C',
    'C++',
    'AI/ML',
    'Web Development',
    'DBMS',
    'Cloud Computing',
    'Cybersecurity',
  ];

  const toggleExpertise = (sub: string) => {
    if (selectedExpertise.includes(sub)) {
      setSelectedExpertise(selectedExpertise.filter((s) => s !== sub));
    } else {
      setSelectedExpertise([...selectedExpertise, sub]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!email.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Real Firebase Registration & Firestore Profile Document Creation
        const registeredUser = await registerWithFirebase({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          institution: institution.trim(),
          expertise: selectedExpertise,
          title: role === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar',
          bio: role === 'teacher_expert'
            ? 'Passionate educator sharing computer science concepts and industry best practices.'
            : 'Student passionate about computer science, software engineering, and peer problem solving.',
        });

        onAuthenticate(registeredUser);
      } else {
        // Real Firebase Login with Email & Password
        const loggedInUser = await loginWithFirebase(email.trim(), password);
        onAuthenticate(loggedInUser);
      }
    } catch (err: any) {
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">LearnNova</span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          {mode === 'register' ? 'Join the Educational Network' : 'Welcome back to LearnNova'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {mode === 'register'
            ? 'Connect with students, teachers, and educational creators (Connected to Firebase)'
            : 'Access verified notes, curated code roadmaps, and community discussions'}
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 p-1 bg-slate-200/80 rounded-xl grid grid-cols-2 gap-1 max-w-xs mx-auto">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-5 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-200/80">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection (Student vs Teacher/Expert) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setRole('student')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      role === 'student'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      {role === 'student' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">Student / Learner</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Explore notes, ask questions & solve problems with peers
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setRole('teacher_expert')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      role === 'teacher_expert'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      {role === 'teacher_expert' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">Teacher / Expert</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Publish study materials, answer student doubts & earn verified badge
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Registration Fields */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu or tech.dev"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password {mode === 'register' && <span className="text-slate-400 font-normal">(min. 6 characters)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-10 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Institution / College (for registration) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {role === 'teacher_expert' ? 'Organization or University' : 'College or School'}
                </label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={
                    role === 'teacher_expert'
                      ? 'e.g. Stanford University / AWS'
                      : 'e.g. School of Computer Engineering'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
                />
              </div>
            )}

            {/* Subject interests (for registration) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Primary Areas of Interest
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSubjects.map((sub) => {
                    const isSelected = selectedExpertise.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        disabled={isLoading}
                        onClick={() => toggleExpertise(sub)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'register' ? 'Registering with Firebase...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Account with Firebase' : 'Sign In to LearnNova'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Landing Page
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
