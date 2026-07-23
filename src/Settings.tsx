import React, { useState } from 'react';
import { db, useCollection } from './db';

import { Trash2, ShieldCheck, AlertTriangle, ExternalLink, Info, Smartphone, Calendar, Bell, Volume2, Vibrate, Moon, Sun, Monitor, User } from 'lucide-react';
import { useWorkoutStore } from './store';
import { useConfirm } from './ConfirmDialog';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const Settings: React.FC = () => {
    const { installPrompt, installApp, theme, setTheme } = useWorkoutStore();
  const confirm = useConfirm();

  const rotinas = useCollection<any>('rotinas') || [];
  const planoSemanal = useCollection<any>('plano_semanal') || [];
  const configuracoes = useCollection<any>('configuracoes') || [];

  const somEnabled = configuracoes.find(c => c.chave === 'som')?.valor !== false;
  const vibracaoEnabled = configuracoes.find(c => c.chave === 'vibracao')?.valor !== false;
  const dataNascimentoConfig = configuracoes.find(c => c.chave === 'data_nascimento')?.valor as string || '';
  const alturaConfig = configuracoes.find(c => c.chave === 'altura_cm')?.valor as string || '';
  const generoConfig = configuracoes.find(c => c.chave === 'genero')?.valor as string || '';

  const updateDataNascimento = async (dataStr: string) => {
    try {
      const conf = configuracoes.find(c => c.chave === 'data_nascimento');
      if (conf) {
        await db.configuracoes.update(conf.id!, { valor: dataStr });
      } else {
        await db.configuracoes.add({ chave: 'data_nascimento', valor: dataStr });
      }
      toast.success('Data de nascimento salva!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar data de nascimento');
    }
  };

  const toggleConfig = async (chave: string, currentValue: boolean) => {
    try {
      const conf = configuracoes.find(c => c.chave === chave);
      if (conf) {
        await db.configuracoes.update(conf.id!, { valor: !currentValue });
      } else {
        await db.configuracoes.add({ chave, valor: !currentValue });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar configuração');
    }
  };

  const updateConfigValue = async (chave: string, valor: string | number) => {
    try {
      const conf = configuracoes.find(c => c.chave === chave);
      if (conf) {
        await db.configuracoes.update(conf.id!, { valor });
      } else {
        await db.configuracoes.add({ chave, valor });
      }
      toast.success('Perfil atualizado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações não suportadas neste navegador.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Notificações ativadas!');
    } else {
      toast.error('Permissão de notificação negada.');
    }
  };

  const updatePlano = async (dia: number, rotinaId: string) => {
    try {
      if (rotinaId === '') {
        await db.plano_semanal.delete(String(dia));
      } else {
        await db.plano_semanal.put({ dia_semana: dia, rotina_id: String(rotinaId) });
      }
      toast.success('Plano atualizado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar plano.');
    }
  };

  const handleClearData = async () => {
    if (await confirm({
      title: 'Apagar tudo',
      message: 'TEM CERTEZA? Isso apagará permanentemente todos os seus dados. Esta ação não pode ser desfeita.',
      confirmLabel: 'Sim, Apagar Tudo',
      variant: 'danger'
    })) {
      await db.exercicios.clear();
      await db.rotinas.clear();
      await db.sessoes.clear();
      await db.biometria.clear();
      toast.success('Todos os dados foram apagados.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold mb-2">Ajustes</h1>

      {/* Planejamento Semanal */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Planejamento Semanal</h2>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">Escolha qual treino você pretende fazer em cada dia da semana.</p>
        
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day, index) => {
            const plano = planoSemanal.find(p => p.dia_semana === index);
            return (
              <div key={day} className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold w-20">{day}</span>
                <select
                  value={plano?.rotina_id || ''}
                  onChange={(e) => updatePlano(index, String(e.target.value))}
                  className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">Descanso / Livre</option>
                  {rotinas.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tema do Aplicativo */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Tema do Aplicativo</h2>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">Selecione o tema visual do aplicativo.</p>
        
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button aria-label="Tema Sistema"
            onClick={() => setTheme('system')}
            className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Monitor size={18} className="mb-1" />
            <span className="text-xs font-bold uppercase">Sistema</span>
          </button>
          <button aria-label="Tema Claro"
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Sun size={18} className="mb-1" />
            <span className="text-xs font-bold uppercase">Claro</span>
          </button>
          <button aria-label="Tema Escuro"
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Moon size={18} className="mb-1" />
            <span className="text-xs font-bold uppercase">Escuro</span>
          </button>
        </div>
      </section>

      {/* Perfil Biológico */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Perfil e Metabolismo</h2>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 mb-4">Esses dados auxiliam no cálculo de queima de calorias estimadas por treino.</p>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Nascimento</label>
              <input
                type="date"
                value={dataNascimentoConfig}
                onChange={(e) => updateDataNascimento(e.target.value)}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-sm w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Altura (cm)</label>
              <input
                type="number"
                placeholder="Ex: 175"
                value={alturaConfig}
                onChange={(e) => updateConfigValue('altura_cm', e.target.value)}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-sm w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Gênero Biológico</label>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button aria-label="Masculino"
                onClick={() => updateConfigValue('genero', 'M')}
                className={`flex-1 py-2 rounded-lg transition-all text-xs font-bold uppercase ${generoConfig === 'M' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Masculino
              </button>
              <button aria-label="Feminino"
                onClick={() => updateConfigValue('genero', 'F')}
                className={`flex-1 py-2 rounded-lg transition-all text-xs font-bold uppercase ${generoConfig === 'F' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Feminino
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Experiência de Treino */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Experiência de Treino</h2>
        </div>
        
        <div className="space-y-2">
          <button aria-label="Botão"             onClick={() => toggleConfig('som', somEnabled)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Volume2 size={20} className={somEnabled ? 'text-primary' : 'text-gray-600 dark:text-gray-400'} />
              <div className="text-left">
                <div className="font-bold text-sm">Sons do Aplicativo</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 uppercase">Tocar bipe no fim do descanso</div>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${somEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${somEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>

          <button aria-label="Botão"             onClick={() => toggleConfig('vibracao', vibracaoEnabled)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Vibrate size={20} className={vibracaoEnabled ? 'text-primary' : 'text-gray-600 dark:text-gray-400'} />
              <div className="text-left">
                <div className="font-bold text-sm">Vibração e Efeitos</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 uppercase">Vibrar no descanso e novo Recorde</div>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${vibracaoEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${vibracaoEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>
        </div>
      </section>

      {/* Notificações Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Notificações</h2>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 mb-6">
          Ative as notificações para ser avisado quando o tempo de descanso terminar, mesmo com o app em segundo plano.
        </p>
        
        <button aria-label="Botão de Ação"           onClick={requestNotificationPermission}
          disabled={notifPermission === 'granted'}
          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
            notifPermission === 'granted' 
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-default' 
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell size={20} />
            <span className="font-bold text-sm">
              {notifPermission === 'granted' ? 'Notificações Ativadas' : 'Ativar Notificações'}
            </span>
          </div>
          {notifPermission === 'granted' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </button>
      </section>

      {/* Backup Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Segurança e Dados</h2>
        </div>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          Seus dados são armazenados apenas neste dispositivo. Recomendamos exportar um backup regularmente.
        </p>

        <div className="space-y-3">
          {installPrompt && (
            <button aria-label="Botão de Ação" onClick={installApp}
              className="w-full flex items-center justify-between p-4 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 group"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={20} />
                <div className="text-left">
                  <div className="font-bold text-sm">Instalar Aplicativo</div>
                  <div className="text-xs text-white/70 uppercase">Acesso rápido na tela inicial</div>
                </div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Dangerous Zone */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-red-500" size={20} />
          <h2 className="font-bold text-lg">Zona de Perigo</h2>
        </div>

        <button aria-label="Botão de Ação"           onClick={handleClearData}
          className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={20} />
          <span className="font-bold text-sm">Apagar todos os dados</span>
        </button>
      </section>

      {/* About */}
      <section className="text-center pt-8 space-y-4">
        <div className="flex justify-center gap-4 text-gray-600 dark:text-gray-400">
          <a href="#" className="hover:text-primary transition-colors"><ExternalLink size={20} /></a>
          <a href="#" className="hover:text-primary transition-colors"><Info size={20} /></a>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Treino PWA v1.0.0</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Desenvolvido para alta performance offline.</p>
        </div>
      </section>
    </div>
  );
};

export default Settings;
