import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestAuthority, setRequestAuthority] = useState(false);
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        email,
        password,
        full_name: fullName,
      };

      if (requestAuthority) {
        payload.authority_application = {
          organization,
          department,
          jurisdiction,
          badge_number: badgeNumber || undefined,
        };
      }

      await register(payload);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black font-black text-xl shadow-glow-cyan">
            P
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Create Patrol Profile</h1>
            <p className="text-xs text-gray-400 font-mono">ENTERPRISE ROAD DEFECT ACCESS</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5" htmlFor="name-input">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                id="name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Officer Priya Sharma"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5" htmlFor="email-reg-input">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                id="email-reg-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.sharma@pwd.gov.in"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5" htmlFor="pass-reg-input">
              Password (min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                id="pass-reg-input"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          {/* Authority Candidate Switch */}
          <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requestAuthority}
                onChange={(e) => setRequestAuthority(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-gray-800 border-gray-700"
              />
              <span className="text-xs font-semibold text-gray-200">
                Apply for Municipal Authority / Road Agency Credential
              </span>
            </label>
            <p className="text-[11px] text-gray-400">
              Authority accounts require formal review and approval by platform administrators before authority-only corridors unlock.
            </p>

            {requestAuthority && (
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Organization / Agency</label>
                    <input
                      type="text"
                      required={requestAuthority}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. National Highways Authority"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Department</label>
                    <input
                      type="text"
                      required={requestAuthority}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Pavement Maintenance"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Jurisdiction / Zone</label>
                    <input
                      type="text"
                      required={requestAuthority}
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      placeholder="e.g. Western Corridor Zone 4"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Badge / Officer ID (Optional)</label>
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g. NHAI-ENG-8819"
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs shadow-glow-emerald transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-400">
          <span>Already registered? </span>
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
