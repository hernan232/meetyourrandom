import Controller from "@ember/controller";
import { inject as service } from "@ember/service";
import { filter } from 'rsvp';

export default Controller.extend({
  cargando: false,
  sesion: service("session"),

  crearChat(usuario) {
    let newChat = this.get("store").createRecord("chat", {
      estado: "iniciado"
    });
    newChat.get("usuarios").pushObject(usuario);
    return newChat;
  },

  actions: {

    async buscar() {
      this.set('cargando', true);
      const usuario = await this.get("store").findRecord(
        "usuario",
        this.get("sesion").get("uid")
      );
      await this.get("store")
      .query("chat", {
        orderBy: "estado",
        equalTo: "iniciado"
      })
      .then(async chats => {
        if (chats.get("length") != 0) {

          const chatValidosPromises = chats.map(chat => {
            return chat.get("usuarios").then(usuarios => {
              return usuarios.get("firstObject");
            }).then(usuarioChat => {
              let minEdadUsuarioChat = usuarioChat.get("rangoEdadPreferido")[0];
              let maxEdadUsuarioChat = usuarioChat.get("rangoEdadPreferido")[1];

              let minEdadUsuario = usuario.get("rangoEdadPreferido")[0];
              let maxEdadUsuario = usuario.get("rangoEdadPreferido")[1];

              // Calcula la edad del usuario actual
              let fechaActual = new Date();
              let fechaNacimientoUsuario = new Date(
                usuario.get("fechaNacimiento")
              );
              let edadUsuario =
              fechaActual.getFullYear() -
              fechaNacimientoUsuario.getFullYear();
              let mesesUsuario =
              fechaActual.getMonth() - fechaNacimientoUsuario.getMonth();

              if (
                mesesUsuario < 0 ||
                (mesesUsuario == 0 &&
                  fechaActual.getDate() < fechaNacimientoUsuario.getDate())
                ) {
                  edadUsuario--;
                }

                //Calcula la edad del usuario chat
                let fechaNacimientoUsuarioChat = new Date(
                  usuarioChat.get("fechaNacimiento")
                );
                let edadUsuarioChat =
                fechaActual.getFullYear() -
                fechaNacimientoUsuarioChat.getFullYear();
                let mesesUsuarioChat =
                fechaActual.getMonth() - fechaNacimientoUsuarioChat.getMonth();

                if (
                  mesesUsuarioChat < 0 ||
                  (mesesUsuarioChat == 0 &&
                    fechaActual.getDate() < fechaNacimientoUsuarioChat.getDate())
                  ) {
                    edadUsuarioChat--;
                  }

                  if (
                    minEdadUsuarioChat <= edadUsuario &&
                    edadUsuario <= maxEdadUsuarioChat &&
                    usuarioChat.get("genero") == usuario.get("generoPreferido") &&
                    minEdadUsuario <= edadUsuarioChat &&
                    edadUsuarioChat <= maxEdadUsuario &&
                    usuario.get("genero") == usuarioChat.get("generoPreferido") &&
                    usuario.get("email") != usuarioChat.get("email")
                  ) {
                    return chat;
                  } else {
                    return null;
                  }
                });
              });

              filter(chatValidosPromises, chat => chat !== null).then((chatsValidos) => {
                let chatCreado;

                if (chatsValidos.length != 0) {
                  chatCreado = chatsValidos[Math.floor(Math.random() * chatsValidos.length)];
                  chatCreado.set('estado', 'conversacion');
                  chatCreado.get('usuarios').pushObject(usuario);
                } else {
                  chatCreado = this.crearChat(usuario);
                }

                chatCreado.save().then((chat) => {
                  this.set('cargando', false);
                  this.transitionToRoute('sesion.chat.interfaz-chat', chat.get('id'));
                });
              });

            } else {
              this.crearChat(usuario).save().then((chat) => {
                this.set('cargando', false);
                this.transitionToRoute('sesion.chat.interfaz-chat', chat.get('id'));
              });
            }
          });
        },

        eliminar(listaUsuariosFavoritos, usuarioEliminar) {
          this.set('cargando', true);
          listaUsuariosFavoritos.then(listaUsuarios => {
            listaUsuarios.get('usuarios').removeObject(usuarioEliminar);
            listaUsuarios.save().then(() => {
              this.set('cargando', false);
              document.getElementById('alerta').innerHTML = 'Usuario favorito eliminado';
              document.getElementById('clickMe').click();
            })
          }).catch(() => {
            document.getElementById('alerta').innerHTML = 'Se ha perdido la conexión con el servidor';
            document.getElementById('clickMe').click();
          });
        },

        enviar(usuarioDestino) {
          this.set('cargando', true);
          let nuevaSolicitud = this.get('store').createRecord('solicitud-conexion', {
            fecha: new Date(),
            estado: false // Sin responder
          });


          this.get('store').findRecord('usuario', this.get('sesion').get('uid')).then(usuarioEmisor => {
            nuevaSolicitud.set('emisor', usuarioEmisor);
            nuevaSolicitud.set('receptor', usuarioDestino);

            usuarioDestino.get('solicitudes').pushObject(nuevaSolicitud);
            let chatNuevo = this.crearChat(usuarioEmisor);
            nuevaSolicitud.set('chat', chatNuevo);
            usuarioDestino.save().then(() => {
              nuevaSolicitud.save().then(() => {
                chatNuevo.save().then((chat) => {
                  this.set('cargando', false);
                  this.transitionToRoute('sesion.chat.interfaz-chat', chat.get('id'));
                })
              })
            });
          }).catch(() => {
            document.getElementById('alerta').innerHTML = 'Se ha perdido la conexión con el servidor';
            document.getElementById('clickMe').click();
          });
        },

        responder(respuesta, solicitud) {
          this.set('cargando', true);
          if(respuesta) {
            this.get('store').findRecord('usuario', this.get('sesion').get('uid')).then(usuario => {
              solicitud.get('chat').then(chatSolicitud =>  {
                chatSolicitud.get('usuarios').pushObject(usuario);
                if(chatSolicitud.get('estado') != 'finalizado') {
                  chatSolicitud.set('estado', 'conversacion');
                }
                chatSolicitud.save().then(() => {
                  solicitud.destroyRecord().then(() => {
                    this.set('cargando', false);
                    this.transitionToRoute('sesion.chat.interfaz-chat', chatSolicitud.get('id'));
                  });
                });
              });
            }).catch(() => {
              document.getElementById('alerta').innerHTML = 'Se ha perdido la conexión con el servidor';
              document.getElementById('clickMe').click();
            });
          } else {
            solicitud.get('chat').then(chatSolicitud => {
              chatSolicitud.set('estado', 'rechazado')
              chatSolicitud.save().then(() => {
                solicitud.destroyRecord().then(() => {
                  this.set('cargando', false);
                });
              });
            }).catch(() => {
              document.getElementById('alerta').innerHTML = 'Se ha perdido la conexión con el servidor';
              document.getElementById('clickMe').click();
            })
          }
        }
      },
    });
