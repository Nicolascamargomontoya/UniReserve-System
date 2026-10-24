import bcrypt from 'bcryptjs';

// Hash unidireccional con sal (gestion-usuarios: Almacenamiento seguro de contraseñas).
export class HashContrasenas {
  constructor(private readonly rondas: number) {}

  calcular(contrasena: string): Promise<string> {
    return bcrypt.hash(contrasena, this.rondas);
  }

  verificar(contrasena: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasena, hash);
  }
}
