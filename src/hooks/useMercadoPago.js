// src/hooks/useMercadoPago.js
import { useState, useEffect } from 'react';

const useMercadoPago = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkMercadoPago = () => {
      if (window.MercadoPago) {
        console.log('✅ MercadoPago SDK disponível');
        setIsLoaded(true);
        setError(null);
        return;
      }

      // Se não estiver disponível, tenta carregar novamente
      console.log('⏳ Aguardando MercadoPago SDK...');
      
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      
      script.onload = () => {
        if (window.MercadoPago) {
          console.log('✅ MercadoPago SDK carregado dinamicamente');
          setIsLoaded(true);
          setError(null);
        } else {
          console.error('❌ MercadoPago SDK não disponível mesmo após carregamento');
          setError('SDK do MercadoPago não pôde ser carregado');
        }
      };

      script.onerror = () => {
        console.error('❌ Erro ao carregar MercadoPago SDK');
        setError('Erro ao carregar SDK do MercadoPago');
      };

      // Só adiciona se não existir
      if (!document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')) {
        document.head.appendChild(script);
      }
    };

    // Verifica imediatamente
    checkMercadoPago();

    // Se não carregar em 5 segundos, tenta novamente
    const timeoutId = setTimeout(() => {
      if (!window.MercadoPago) {
        console.log('⚠️ Tentando carregar MercadoPago SDK novamente...');
        checkMercadoPago();
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  return { isLoaded, error };
};

export default useMercadoPago;