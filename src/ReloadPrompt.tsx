import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-primary p-4 z-[100] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
            <RefreshCw size={24} className={needRefresh ? "animate-spin-slow" : ""} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {offlineReady ? 'App pronto para uso offline' : '✨ Nova versão disponível!'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {offlineReady
                ? 'O aplicativo foi instalado em cache com sucesso.'
                : 'Baixamos melhorias no fundo. Clique para atualizar a tela e aplicá-las agora mesmo.'}
            </p>
          </div>
        </div>
        <button aria-label="Fechar Aviso" onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={20} />
        </button>
      </div>
      
      <div className="mt-4 flex gap-2">
        {needRefresh && (
          <button 
            onClick={() => updateServiceWorker(true)}
            className="flex-1 bg-primary text-white font-bold py-2 rounded-xl hover:bg-opacity-90 transition-colors"
          >
            ATUALIZAR AGORA
          </button>
        )}
      </div>
    </div>
  )
}

export default ReloadPrompt
