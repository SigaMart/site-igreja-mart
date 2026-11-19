/// <reference path="../worker-configuration.d.ts" />
declare namespace App {
  interface Locals {
    usuario?: import('./lib/admin/auth').UsuarioSessao;
  }
  interface SessionData {
    usuario: import('./lib/admin/auth').UsuarioSessao;
  }
}
