# Template para crear endpoints de maestros

## Estructura de carpetas
```
app/api/
├── operacion/
│   ├── route.ts       (GET todos, POST crear)
│   └── [id]/route.ts  (GET por id, PUT actualizar, DELETE)
├── materiales/
├── vehiculo/
├── fundo/
├── usuario/
└── movimiento/
```

## Template route.ts (GET y POST)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NombreTabla, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('nombre_tabla')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data } as ApiResponse<NombreTabla[]>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validar campos requeridos
    
    const { data, error } = await supabase
      .from('nombre_tabla')
      .insert([body])
      .select();

    if (error) throw error;
    return NextResponse.json(
      { success: true, data: data[0], message: 'Creado exitosamente' } as ApiResponse<NombreTabla>,
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
```

## Template [id]/route.ts (GET, PUT, DELETE)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NombreTabla, ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('nombre_tabla')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data } as ApiResponse<NombreTabla>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('nombre_tabla')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({
      success: true,
      data,
      message: 'Actualizado exitosamente',
    } as ApiResponse<NombreTabla>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('nombre_tabla')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      message: 'Eliminado exitosamente',
    } as ApiResponse<null>);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
```

## Tablas a crear (copia el template arriba):
- [ ] operacion/[id]/route.ts
- [ ] materiales/route.ts y [id]/route.ts
- [ ] vehiculo/route.ts y [id]/route.ts
