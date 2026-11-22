-- =====================================================================
-- 009 — Permissões do servidor (funções de pagamento)
-- Este projeto não libera tabelas automaticamente nem para o servidor.
-- As funções criar-pagamento e aviso-infinitepay usam a chave de serviço
-- (service_role), que precisa destas permissões. O site continua sem acesso.
-- Rode no SQL Editor. Pode rodar de novo.
-- =====================================================================

grant usage on schema public to service_role;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Para tabelas e funções criadas no futuro
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
