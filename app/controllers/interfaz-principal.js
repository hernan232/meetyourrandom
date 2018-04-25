import Controller from '@ember/controller';
import { inject as Service } from '@ember/service';

export default Controller.extend({
 
   session: Service('session'),
   actions: {
        iniciarSesion: function(provider) {
          let self = this;
          if(self.get('email') === undefined || self.get('email') === ""){
            alert("el campo de email esta vacio");
            return;
          }
          if(self.get('password') === undefined || self.get('password') === ""){
            alert("el campo de la contraseña esta vacio");
            return;
          }
          this.get('session').open('firebase', { 
            provider: provider,
            email: self.get('email'),
            password: self.get('password')})
                .then(function() {
                    self.transitionToRoute('sesion.usuario');
                }).catch(function(error){
                    if(error.code === "auth/user-not-found" || 
                        error.code === "auth/wrong-password" || error.code === "auth/invalid-email" 
                        || error.code === "auth/wrong-password"){
                        alert("Usuario o la contraseña son invalidos");
                    }
                });
        },
        cerrarSesion: function(){
            this.get('session').close();
        }
    }

});