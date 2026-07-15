export type Roles = {
  id: number;
  descripcion: string;
  created_at: string;
};

export type Trabajadores = {
  id: number;
  dni: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  supervisor?: boolean;
  eliminado?: boolean;
  empresa_id?: number;
  tipo_trabajador_id?: number;
  area?: string;
  cargo?: string;
  tipo_trabajador?: string;
  regimen?: string;
  centro_costo?: string;
  vigencia?: string;
  fecha_ingreso?: string;
  fecha_cese?: string;
  cod_funcionario?: string;
  planilla_nisira?: string;
  created_at: string;
};

export type Empresa = {
  id: number;
  descripcion: string;
  created_at: string;
};

export type Operacion = {
  id: number;
  descripcion: string;
  created_at: string;
};

export type Materiales = {
  id: number;
  descripcion: string;
  stock: number;
  um?: string;
  cod?: string;
  pu?: number;
  created_at: string;
  updated_at: string;
};

export type Vehiculo = {
  id: number;
  placa: string;
  marca: string | null;
  created_at: string;
};

export type Fundo = {
  id: number;
  descripcion: string;
  idempresa: number;
  created_at: string;
};

export type Usuario = {
  id: number;
  grupo: string | null;
  trabajadorid: number;
  rolid: number;
  created_at: string;
};

export type Movimiento = {
  id: number;
  fecha: string;
  idusuarioorigen: number;
  idusuariodestino: number | null;
  idmaterial: number;
  idvehiculo: number | null;
  idfundoorigen: number;
  idfundodestino: number;
  idoperacion: number;
  precinto: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
