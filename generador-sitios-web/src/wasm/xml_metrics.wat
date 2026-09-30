(module
  ;; =========================================================================
  ;; xml_metrics.wat — Módulo WebAssembly nativo para generador-sitios-xml
  ;; Análisis de métricas, conteo léxico de etiquetas XML y hash FNV-1a
  ;; =========================================================================

  (memory (export "memory") 1)

  ;; -------------------------------------------------------------------------
  ;; FNV-1a 32-bit hash para verificación de integridad ultrarrápida del XML
  ;; -------------------------------------------------------------------------
  (func $calcular_hash (export "calcular_hash") (param $ptr i32) (param $len i32) (result i32)
    (local $hash i32)
    (local $end i32)
    (local $curr i32)
    (local $b i32)

    ;; hash inicial: 2166136261 (0x811c9dc5)
    i32.const 0x811c9dc5
    local.set $hash

    local.get $ptr
    local.set $curr

    local.get $ptr
    local.get $len
    i32.add
    local.set $end

    (block $break
      (loop $top
        local.get $curr
        local.get $end
        i32.ge_u
        br_if $break

        ;; Cargar byte de memoria lineal
        local.get $curr
        i32.load8_u
        local.set $b

        ;; hash = (hash ^ b) * 16777619
        local.get $hash
        local.get $b
        i32.xor
        i32.const 16777619
        i32.mul
        local.set $hash

        ;; Siguiente byte
        local.get $curr
        i32.const 1
        i32.add
        local.set $curr

        br $top
      )
    )

    local.get $hash
  )

  ;; -------------------------------------------------------------------------
  ;; Conteo a bajo nivel de caracteres '<' (apertura de etiquetas XML)
  ;; -------------------------------------------------------------------------
  (func $contar_etiquetas_xml (export "contar_etiquetas_xml") (param $ptr i32) (param $len i32) (result i32)
    (local $count i32)
    (local $curr i32)
    (local $end i32)
    (local $b i32)

    i32.const 0
    local.set $count

    local.get $ptr
    local.set $curr

    local.get $ptr
    local.get $len
    i32.add
    local.set $end

    (block $break
      (loop $top
        local.get $curr
        local.get $end
        i32.ge_u
        br_if $break

        local.get $curr
        i32.load8_u
        local.set $b

        ;; ASCII 60 es '<'
        local.get $b
        i32.const 60
        i32.eq
        if
          local.get $count
          i32.const 1
          i32.add
          local.set $count
        end

        local.get $curr
        i32.const 1
        i32.add
        local.set $curr

        br $top
      )
    )

    local.get $count
  )

  ;; -------------------------------------------------------------------------
  ;; Cálculo de puntuación de complejidad estructural del XML
  ;; score = (etiquetas * 1.5) + (len / 100.0)
  ;; -------------------------------------------------------------------------
  (func $calcular_puntuacion_complejidad (export "calcular_puntuacion_complejidad") (param $etiquetas i32) (param $len i32) (result f32)
    local.get $etiquetas
    f32.convert_i32_s
    f32.const 1.5
    f32.mul

    local.get $len
    f32.convert_i32_s
    f32.const 100.0
    f32.div

    f32.add
  )
)
