(module

  ;; ----------------------------------------------------------
  ;; factorial(n) → n!
  ;; ----------------------------------------------------------
  (func $factorial (export "factorial") (param $n i64) (result i64)
    (local $resultado i64)

    ;; resultado empieza en 1
    (local.set $resultado (i64.const 1))

    (block $salir
      (loop $bucle
        ;; si n <= 1, terminamos
        (br_if $salir
          (i64.le_u (local.get $n) (i64.const 1))
        )

        ;; resultado = resultado * n
        (local.set $resultado
          (i64.mul (local.get $resultado) (local.get $n))
        )

        ;; n = n - 1
        (local.set $n
          (i64.sub (local.get $n) (i64.const 1))
        )

        (br $bucle)
      )
    )

    (local.get $resultado)
  )


  ;; ----------------------------------------------------------
  ;; coseno(x) → aproximacion de cos(x) con serie de Taylor
  ;;
  ;; cos(x) = 1 - x²/2! + x⁴/4! - x⁶/6! + ...
  ;; ----------------------------------------------------------
  (func $coseno (export "coseno") (param $x f64) (result f64)
    (local $suma     f64)
    (local $termino  f64)
    (local $x2       f64)
    (local $i        i32)
    (local $dos_i    f64)

    ;; x² = x * x
    (local.set $x2 (f64.mul (local.get $x) (local.get $x)))

    ;; termino_0 = 1.0, suma = 1.0, contador i = 1
    (local.set $termino (f64.const 1.0))
    (local.set $suma    (f64.const 1.0))
    (local.set $i       (i32.const 1))

    (block $salir
      (loop $bucle
        ;; Parar despues de 20 terminos
        (br_if $salir
          (i32.gt_u (local.get $i) (i32.const 20))
        )

        ;; dos_i = 2*i  
        (local.set $dos_i
          (f64.convert_i32_u (i32.mul (local.get $i) (i32.const 2)))
        )

        ;; termino = termino * (-x²) / ((2i-1) * 2i)
        (local.set $termino
          (f64.div
            (f64.mul (local.get $termino) (f64.neg (local.get $x2)))
            (f64.mul
              (f64.sub (local.get $dos_i) (f64.const 1.0))
              (local.get $dos_i)
            )
          )
        )

        ;; suma = suma + termino
        (local.set $suma (f64.add (local.get $suma) (local.get $termino)))

        ;; i = i + 1
        (local.set $i (i32.add (local.get $i) (i32.const 1)))

        (br $bucle)
      )
    )

    (local.get $suma)
  )


  ;; ----------------------------------------------------------
  ;; es_primo(n) → 1 si n es primo, 0 si no lo es
  ;; ----------------------------------------------------------
  (func $es_primo (export "es_primo") (param $n i32) (result i32)
    (local $d i32)

    ;; Casos base: n < 2 → no primo
    (if (i32.lt_u (local.get $n) (i32.const 2))
      (then (return (i32.const 0)))
    )

    ;; n == 2 → primo
    (if (i32.eq (local.get $n) (i32.const 2))
      (then (return (i32.const 1)))
    )

    ;; n par y distinto de 2 → no primo
    (if (i32.eqz (i32.rem_u (local.get $n) (i32.const 2)))
      (then (return (i32.const 0)))
    )

    ;; Probar divisores impares: 3, 5, 7, … mientras d*d <= n
    (local.set $d (i32.const 3))

    (block $salir
      (loop $bucle
        ;; si d*d > n, es primo → salir
        (br_if $salir
          (i32.gt_u
            (i32.mul (local.get $d) (local.get $d))
            (local.get $n)
          )
        )

        ;; si n % d == 0 → no es primo
        (if (i32.eqz (i32.rem_u (local.get $n) (local.get $d)))
          (then (return (i32.const 0)))
        )

        ;; d = d + 2 (solo impares)
        (local.set $d
          (i32.add (local.get $d) (i32.const 2))
        )

        (br $bucle)
      )
    )

    ;; Si llegamos aquí, es primo
    (i32.const 1)
  )

)
