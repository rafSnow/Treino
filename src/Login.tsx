import React from 'react';
import { useAuth } from './AuthContext';
import { Dumbbell } from 'lucide-react';

const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1a1a1a] p-4 text-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 max-w-sm w-full animate-in fade-in slide-in-from-bottom duration-500">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/20 p-4 rounded-full text-primary">
            <Dumbbell size={48} />
          </div>
        </div>
        <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">TreinoApp</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
          Sincronize seus treinos na nuvem, acesse de qualquer lugar e nunca mais perca seus dados.
        </p>
        
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-4 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

export default Login;
