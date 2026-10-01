  (module
    ;; =========================================================================
    ;; vona_geodesy.wat — Módulo WebAssembly nativo para el visor VONA
    ;; Cálculo de geodesia esférica y dispersión de pluma volcánica
    ;; Escrito directamente en WebAssembly Text Format (WAT)
    ;; =========================================================================

    ;; -------------------------------------------------------------------------
    ;; Función interna: sin(x) con reducción de rango estricta a [-pi/2, pi/2]
    ;; y aproximación polinomial de alta precisión (Taylor orden 9)
    ;; -------------------------------------------------------------------------
    (func $sin (export "sin") (param $x f64) (result f64)
      (local $k f64)
      (local $x2 f64)
      (local $x3 f64)
      (local $x5 f64)
      (local $x7 f64)
      (local $x9 f64)

      ;; k = floor(x / 2pi)
      local.get $x
      f64.const 6.2831853071795864769
      f64.div
      f64.floor
      local.set $k

      ;; x = x - k * 2pi -> [0, 2pi)
      local.get $x
      local.get $k
      f64.const 6.2831853071795864769
      f64.mul
      f64.sub
      local.set $x

      ;; if x < 0.0 -> x = x + 2pi
      local.get $x
      f64.const 0.0
      f64.lt
      if
        local.get $x
        f64.const 6.2831853071795864769
        f64.add
        local.set $x
      end

      ;; if x > pi -> x = x - 2pi -> [-pi, pi]
      local.get $x
      f64.const 3.14159265358979323846
      f64.gt
      if
        local.get $x
        f64.const 6.2831853071795864769
        f64.sub
        local.set $x
      end

      ;; Reducción al primer cuadrante [-pi/2, pi/2]
      local.get $x
      f64.const 1.57079632679489661923
      f64.gt
      if
        f64.const 3.14159265358979323846
        local.get $x
        f64.sub
        local.set $x
      else
        local.get $x
        f64.const -1.57079632679489661923
        f64.lt
        if
          f64.const -3.14159265358979323846
          local.get $x
          f64.sub
          local.set $x
        end
      end

      ;; Potencias de x
      local.get $x
      local.get $x
      f64.mul
      local.set $x2

      local.get $x
      local.get $x2
      f64.mul
      local.set $x3

      local.get $x3
      local.get $x2
      f64.mul
      local.set $x5

      local.get $x5
      local.get $x2
      f64.mul
      local.set $x7

      local.get $x7
      local.get $x2
      f64.mul
      local.set $x9

      ;; res = x - x3/6 + x5/120 - x7/5040 + x9/362880 - (x9*x2)/39916800
      local.get $x
      local.get $x3
      f64.const 6.0
      f64.div
      f64.sub

      local.get $x5
      f64.const 120.0
      f64.div
      f64.add

      local.get $x7
      f64.const 5040.0
      f64.div
      f64.sub

      local.get $x9
      f64.const 362880.0
      f64.div
      f64.add

      local.get $x9
      local.get $x2
      f64.mul
      f64.const 39916800.0
      f64.div
      f64.sub
    )

    ;; -------------------------------------------------------------------------
    ;; cos(x) exacto mediante desfase: cos(x) = sin(x + pi/2)
    ;; -------------------------------------------------------------------------
    (func $cos (export "cos") (param $x f64) (result f64)
      local.get $x
      f64.const 1.57079632679489661923
      f64.add
      call $sin
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
    ;; distancia_km(lat1, lon1, lat2, lon2) → distancia geodésica en km
    ;; -------------------------------------------------------------------------
    (func $distancia_km (export "distancia_km")
      (param $lat1 f64) (param $lon1 f64) (param $lat2 f64) (param $lon2 f64)
      (result f64)
      (local $dlat f64)
      (local $dlon_deg f64)
      (local $lat_media f64)
      (local $cos_lat f64)
      (local $dlon f64)

      ;; dlat = (lat2 - lat1) * 111.13295
      local.get $lat2
      local.get $lat1
      f64.sub
      f64.const 111.13295
      f64.mul
      local.set $dlat

      ;; dlon_deg = lon2 - lon1
      local.get $lon2
      local.get $lon1
      f64.sub
      local.set $dlon_deg

      ;; Ajuste por cruce de antimeridiano (> 180 o < -180)
      local.get $dlon_deg
      f64.const 180.0
      f64.gt
      if
        local.get $dlon_deg
        f64.const 360.0
        f64.sub
        local.set $dlon_deg
      else
        local.get $dlon_deg
        f64.const -180.0
        f64.lt
        if
          local.get $dlon_deg
          f64.const 360.0
          f64.add
          local.set $dlon_deg
        end
      end

      ;; lat_media = ((lat1 + lat2) * 0.5) * (pi / 180)
      local.get $lat1
      local.get $lat2
      f64.add
      f64.const 0.5
      f64.mul
      f64.const 0.017453292519943295
      f64.mul
      local.set $lat_media

      ;; cos_lat = cos(lat_media)
      local.get $lat_media
      call $cos
      local.set $cos_lat

      ;; dlon = dlon_deg * 111.13295 * cos_lat
      local.get $dlon_deg
      f64.const 111.13295
      f64.mul
      local.get $cos_lat
      f64.mul
      local.set $dlon

      ;; return sqrt(dlat^2 + dlon^2)
      local.get $dlat
      local.get $dlat
      f64.mul
      local.get $dlon
      local.get $dlon
      f64.mul
      f64.add
      f64.sqrt
    )
  )
