import React, { useRef, useState } from 'react';
import { db } from './db';
import { exportDB, importDB } from 'dexie-export-import';
import { Download, Upload, Trash2, ShieldCheck, AlertTriangle, ExternalLink, Info, Smartphone } from 'lucide-react';
import { useWorkoutStore } from './store';

const Settings: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { installPrompt, installApp } = useWorkoutStore();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_treino_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erro ao exportar dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Ao importar, todos os dados atuais serão substituídos. Deseja continuar?')) {
      return;
    }

    try {
      setIsImporting(true);
      // Clear existing data (optional, importDB can handle it but sometimes it's better to be explicit)
      await db.delete();
      await db.open();
      await importDB(file);
      alert('Dados importados com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Erro ao importar dados. Verifique se o arquivo é um backup válido.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('TEM CERTEZA? Isso apagará permanentemente todos os seus exercícios, rotinas e histórico.')) {
      await db.delete();
      alert('Todos os dados foram apagados.');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      <h1 className="text-2xl font-bold mb-2">Ajustes</h1>

      {/* Backup Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-primary" size={20} />
          <h2 className="font-bold text-lg">Segurança e Dados</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Seus dados são armazenados apenas neste dispositivo. Recomendamos exportar um backup regularmente.
        </p>

        <div className="space-y-3">
          {installPrompt && (
            <button
              onClick={installApp}
              className="w-full flex items-center justify-between p-4 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 group"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={20} />
                <div className="text-left">
                  <div className="font-bold text-sm">Instalar Aplicativo</div>
                  <div className="text-[10px] text-white/70 uppercase">Acesso rápido na tela inicial</div>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-primary/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-gray-400 group-hover:text-primary" />
              <div className="text-left">
                <div className="font-bold text-sm">Exportar Backup</div>
                <div className="text-[10px] text-gray-400 uppercase">Salvar arquivo .json</div>
              </div>
            </div>
            {isExporting && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
          </button>

          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-primary/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-gray-400 group-hover:text-primary" />
              <div className="text-left">
                <div className="font-bold text-sm">Importar Backup</div>
                <div className="text-[10px] text-gray-400 uppercase">Restaurar de um arquivo</div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </button>
        </div>
      </section>

      {/* Dangerous Zone */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-red-500" size={20} />
          <h2 className="font-bold text-lg">Zona de Perigo</h2>
        </div>

        <button
          onClick={handleClearData}
          className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={20} />
          <span className="font-bold text-sm">Apagar todos os dados</span>
        </button>
      </section>

      {/* About */}
      <section className="text-center pt-8 space-y-4">
        <div className="flex justify-center gap-4 text-gray-400">
          <a href="#" className="hover:text-primary transition-colors"><ExternalLink size={20} /></a>
          <a href="#" className="hover:text-primary transition-colors"><Info size={20} /></a>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Treino PWA v1.0.0</p>
          <p className="text-[10px] text-gray-500 mt-1">Desenvolvido para alta performance offline.</p>
        </div>
      </section>
    </div>
  );
};

export default Settings;
