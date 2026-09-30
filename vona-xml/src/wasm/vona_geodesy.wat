(module
  ;; =========================================================================
  ;; vona_geodesy.wat — Módulo WebAssembly nativo para el visor VONA
  ;; Cálculo de geodesia esférica, dispersión de pluma volcánica y benchmarking
  ;; Escrito directamente en WebAssembly Text Format (WAT)
  ;; =========================================================================

  ;; -------------------------------------------------------------------------
  ;; Función interna: sin(x) aproximado mediante serie de Taylor
  ;; sin(x) = x - x³/3! + x⁵/5! - x⁷/7!
  ;; -------------------------------------------------------------------------
  (func $sin (export "sin") (param $x f64) (result f64)
    (local $x2 f64)
    (local $x3 f64)
    (local $res f64)

    ;; x² = x * x
    local.get $x
    local.get $x
    f64.mul
    local.set $x2

    ;; x³ = x * x²
    local.get $x
    local.get $x2
    f64.mul
    local.set $x3

    ;; res = x - (x³ / 6.0)
    local.get $x
    local.get $x3
    f64.const 6.0
    f64.div
    f64.sub
    local.set $res

    ;; res = res + (x³ * x² / 120.0)  [término x⁵ / 5!]
    local.get $res
    local.get $x3
    local.get $x2
    f64.mul
    f64.const 120.0
    f64.div
    f64.add
    local.set $res

    ;; res = res - (x³ * x² * x² / 5040.0) [término x⁷ / 7!]
    local.get $res
    local.get $x3
    local.get $x2
    f64.mul
    local.get $x2
    f64.mul
    f64.const 5040.0
    f64.div
    f64.sub
    local.set $res

    local.get $res
  )

  ;; -------------------------------------------------------------------------
  ;; Función interna: cos(x) aproximado mediante serie de Taylor
  ;; cos(x) = 1 - x²/2! + x⁴/4! - x⁶/6!
  ;; -------------------------------------------------------------------------
  (func $cos (export "cos") (param $x f64) (result f64)
    (local $x2 f64)
    (local $x4 f64)
    (local $res f64)

    ;; x² = x * x
    local.get $x
    local.get $x
    f64.mul
    local.set $x2

    ;; x⁴ = x² * x²
    local.get $x2
    local.get $x2
    f64.mul
    local.set $x4

    ;; res = 1.0 - (x² / 2.0)
    f64.const 1.0
    local.get $x2
    f64.const 2.0
    f64.div
    f64.sub
    local.set $res

    ;; res = res + (x⁴ / 24.0)
    local.get $res
    local.get $x4
    f64.const 24.0
    f64.div
    f64.add
    local.set $res

    ;; res = res - (x⁴ * x² / 720.0)
    local.get $res
    local.get $x4
    local.get $x2
    f64.mul
    f64.const 720.0
    f64.div
    f64.sub
    local.set $res

    local.get $res
  )

  ;; -------------------------------------------------------------------------
  ;; dest_lat(lat, lon, rumbo, distanciaKm) → latitud destino
  ;; r_rad = rumbo * (π / 180)
  ;; dy = dist * cos(r_rad)
  ;; dlat = dy / 111.13295 km/grado
  ;; return lat + dlat
  ;; -------------------------------------------------------------------------
  (func $dest_lat (export "dest_lat") 
    (param $lat f64) (param $lon f64) (param $rumbo f64) (param $dist f64) 
    (result f64)
    (local $r_rad f64)
    (local $dlat f64)

    ;; r_rad = rumbo * 0.017453292519943295
    local.get $rumbo
    f64.const 0.017453292519943295
    f64.mul
    local.set $r_rad

    ;; dlat = (dist * cos(r_rad)) / 111.13295
    local.get $dist
    local.get $r_rad
    call $cos
    f64.mul
    f64.const 111.13295
    f64.div
    local.set $dlat

    ;; return lat + dlat
    local.get $lat
    local.get $dlat
    f64.add
  )

  ;; -------------------------------------------------------------------------
  ;; dest_lon(lat, lon, rumbo, distanciaKm) → longitud destino
  ;; dx = dist * sin(r_rad)
  ;; dlon = dx / (111.13295 * cos(lat_rad))
  ;; return lon + dlon
  ;; -------------------------------------------------------------------------
  (func $dest_lon (export "dest_lon") 
    (param $lat f64) (param $lon f64) (param $rumbo f64) (param $dist f64) 
    (result f64)
    (local $r_rad f64)
    (local $dx f64)
    (local $cos_lat f64)
    (local $dlon f64)

    ;; r_rad = rumbo * 0.017453292519943295
    local.get $rumbo
    f64.const 0.017453292519943295
    f64.mul
    local.set $r_rad

    ;; dx = dist * sin(r_rad)
    local.get $dist
    local.get $r_rad
    call $sin
    f64.mul
    local.set $dx

    ;; cos_lat = cos(lat * 0.017453292519943295)
    local.get $lat
    f64.const 0.017453292519943295
    f64.mul
    call $cos
    local.set $cos_lat

    ;; dlon = dx / (111.13295 * cos_lat)
    local.get $dx
    f64.const 111.13295
    local.get $cos_lat
    f64.mul
    f64.div
    local.set $dlon

    ;; return lon + dlon
    local.get $lon
    local.get $dlon
    f64.add
  )

  ;; -------------------------------------------------------------------------
  ;; plume_area(distKm, aperturaDeg) → área del sector circular en km²
  ;; Area = 0.5 * dist² * (apertura * π / 180)
  ;;      = dist * dist * apertura * 0.008726646259971648
  ;; -------------------------------------------------------------------------
  (func $plume_area (export "plume_area") 
    (param $dist f64) (param $apertura f64) 
    (result f64)
    local.get $dist
    local.get $dist
    f64.mul
    local.get $apertura
    f64.mul
    f64.const 0.008726646259971648
    f64.mul
  )

  ;; -------------------------------------------------------------------------
  ;; benchmark_geodesy(lat, lon, rumbo, dist, iteraciones) → prueba de estrés CPU
  ;; Ejecuta un bucle real de N iteraciones calculando la geodesia en WASM
  ;; -------------------------------------------------------------------------
  (func $benchmark_geodesy (export "benchmark_geodesy") 
    (param $lat f64) (param $lon f64) (param $rumbo f64) (param $dist f64) (param $iter i32) 
    (result f64)
    (local $acc f64)
    (local $i i32)

    f64.const 0.0
    local.set $acc

    i32.const 0
    local.set $i

    (block $salir
      (loop $bucle
        ;; si i >= iteraciones, salir
        local.get $i
        local.get $iter
        i32.ge_s
        br_if $salir

        ;; acc = acc + dest_lat(...) + dest_lon(...)
        local.get $acc
        local.get $lat
        local.get $lon
        local.get $rumbo
        local.get $dist
        call $dest_lat
        f64.add
        local.get $lat
        local.get $lon
        local.get $rumbo
        local.get $dist
        call $dest_lon
        f64.add
        local.set $acc

        ;; i = i + 1
        local.get $i
        i32.const 1
        i32.add
        local.set $i

        br $bucle
      )
    )

    local.get $acc
  )
)
