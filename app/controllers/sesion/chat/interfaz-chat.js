import Controller from "@ember/controller";
import { inject as service } from "@ember/service";

export default Controller.extend({
  sesion: service("session"),
  cargando: false,
  actions: {
    enviar() {
      let mensaje = this.get("contenidoMensaje");

      let nuevoMensaje = this.get("store").createRecord("mensaje", {
        contenido: mensaje,
        fecha: new Date()
      });

      // Recupera el autor del Store
      this.get("store")
        .findRecord("usuario", this.get("sesion").get("uid"))
        .then(autorMensaje => {
          nuevoMensaje.set("emisor", autorMensaje);

          nuevoMensaje.set("chat", this.get("model"));
          this.get("model")
            .get("mensajes")
            .pushObject(nuevoMensaje);
          this.get("model")
            .save()
            .then(() => {
              nuevoMensaje
                .save()
                .then(() => {
                  this.set("contenidoMensaje", "");
                });
            });
        }).catch(() => {
          document.getElementById("alerta").innerHTML =
            "El mensaje no pudo ser enviado por problemas de conexión";
          document.getElementById("clickMe").click();
        });
    },

    cerrar() {
      this.get("model").set("estado", "finalizado");
      this.get("model")
        .save()
        .then(() => {
          this.transitionToRoute(
            "sesion.usuario",
            this.get("sesion").get("uid")
          );
        })
        .catch(() => {
          document.getElementById("alerta").innerHTML =
            "Se ha perdido la conexión con el servidor";
          document.getElementById("clickMe").click();
        });
    },

    agregar() {
      this.get("store")
        .findRecord("usuario", this.get("sesion").get("uid"))
        .then(usuarioActual => {
          this.get("model")
            .get("favoritos")
            .pushObject(usuarioActual);
          this.get("model")
            .save()
            .then(chat => {
              this.get('model').set("favoritoSeleccionado", true);
              if (chat.get("favoritos").get("length") == 2) {
                this.get("model")
                  .get("usuarios")
                  .then(usuariosChat => {
                    usuariosChat.forEach(usuarioChat => {
                      if (
                        usuarioChat.get("id") != this.get("sesion").get("uid")
                      ) {
                        // En este momento tengo al otro usuario para agregarlo a mis favoritos
                        usuarioActual
                          .get("listaFavoritos")
                          .then(listaFavoritosUsuarioActual => {
                            listaFavoritosUsuarioActual
                              .get("usuarios")
                              .pushObject(usuarioChat);
                            listaFavoritosUsuarioActual.save().then(() => {
                              usuarioChat
                                .get("listaFavoritos")
                                .then(listaFavoritosUsuarioChat => {
                                  listaFavoritosUsuarioChat
                                    .get("usuarios")
                                    .pushObject(usuarioActual);
                                  listaFavoritosUsuarioChat.save();
                                });
                            });
                          });
                      }
                    });
                  });
              }
            })
            .catch(() => {
              document.getElementById("alerta").innerHTML =
                "Se ha perdido la conexión con el servidor";
              document.getElementById("clickMe").click();
            });
        });
    }
  }
});
