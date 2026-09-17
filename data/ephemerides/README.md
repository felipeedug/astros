# Dados binarios preservados

Estes arquivos foram copiados do projeto original Astrovida e sao consumidos pelo nucleo legado:

- `Externos.Efe`: Jupiter, Saturno, Urano, Netuno e Plutao
- `Asteroides.Efe`: Demeter, Pallas, Juno e Vesta
- `Chiron.Efe`: Chiron

O acesso original usa blocos binarios de 80 dias. A camada de compatibilidade tenta primeiro o caminho informado e depois `data/ephemerides/<arquivo>`.
