(module

  ;; Factorial de un entero de 64 bits (n!)
  (func $factorial (export "factorial") (param $n i64) (result i64)
    (local $r i64)
    (local.set $r (i64.const 1))
    (block $end
      (loop $loop
        (br_if $end (i64.le_u (local.get $n) (i64.const 1)))
        (local.set $r (i64.mul (local.get $r) (local.get $n)))
        (local.set $n (i64.sub (local.get $n) (i64.const 1)))
        (br $loop)
      )
    )
    (local.get $r)
  )

  ;; Benchmark de factorial INLINED (sin sobrecarga de llamadas a función por iteración)
  (func $bench_factorial (export "bench_factorial") (param $n i64) (param $reps i32) (result i64)
    (local $r i64)
    (local $cur i64)
    (block $end_bench
      (loop $loop_bench
        (br_if $end_bench (i32.eqz (local.get $reps)))
        ;; Cálculo inlined de factorial
        (local.set $r (i64.const 1))
        (local.set $cur (local.get $n))
        (block $end_fact
          (loop $loop_fact
            (br_if $end_fact (i64.le_u (local.get $cur) (i64.const 1)))
            (local.set $r (i64.mul (local.get $r) (local.get $cur)))
            (local.set $cur (i64.sub (local.get $cur) (i64.const 1)))
            (br $loop_fact)
          )
        )
        (local.set $reps (i32.sub (local.get $reps) (i32.const 1)))
        (br $loop_bench)
      )
    )
    (local.get $r)
  )

  ;; Coseno mediante serie de Taylor (15 términos, precisión IEEE-754 completa)
  (func $coseno (export "coseno") (param $x f64) (result f64)
    (local $suma    f64)
    (local $termino f64)
    (local $neg_x2  f64)
    (local $di      i32)
    (local $denom   f64)
    (local.set $neg_x2 (f64.neg (f64.mul (local.get $x) (local.get $x))))
    (local.set $termino (f64.const 1.0))
    (local.set $suma    (f64.const 1.0))
    (local.set $di      (i32.const 2))
    (block $end
      (loop $loop
        (br_if $end (i32.gt_u (local.get $di) (i32.const 30)))
        ;; denom = (di - 1) * di
        (local.set $denom
          (f64.convert_i32_u
            (i32.mul
              (i32.sub (local.get $di) (i32.const 1))
              (local.get $di)
            )
          )
        )
        ;; termino = (termino * -x^2) / denom
        (local.set $termino
          (f64.div
            (f64.mul (local.get $termino) (local.get $neg_x2))
            (local.get $denom)
          )
        )
        (local.set $suma (f64.add (local.get $suma) (local.get $termino)))
        (local.set $di (i32.add (local.get $di) (i32.const 2)))
        (br $loop)
      )
    )
    (local.get $suma)
  )

  ;; Benchmark de coseno INLINED (sin sobrecarga de llamadas a función por iteración)
  (func $bench_coseno (export "bench_coseno") (param $x f64) (param $reps i32) (result f64)
    (local $suma    f64)
    (local $termino f64)
    (local $neg_x2  f64)
    (local $di      i32)
    (local $denom   f64)
    (local.set $neg_x2 (f64.neg (f64.mul (local.get $x) (local.get $x))))
    (block $end_bench
      (loop $loop_bench
        (br_if $end_bench (i32.eqz (local.get $reps)))
        ;; Cálculo inlined de la serie de Taylor (15 términos)
        (local.set $termino (f64.const 1.0))
        (local.set $suma    (f64.const 1.0))
        (local.set $di      (i32.const 2))
        (block $end_taylor
          (loop $loop_taylor
            (br_if $end_taylor (i32.gt_u (local.get $di) (i32.const 30)))
            (local.set $denom
              (f64.convert_i32_u
                (i32.mul
                  (i32.sub (local.get $di) (i32.const 1))
                  (local.get $di)
                )
              )
            )
            (local.set $termino
              (f64.div
                (f64.mul (local.get $termino) (local.get $neg_x2))
                (local.get $denom)
              )
            )
            (local.set $suma (f64.add (local.get $suma) (local.get $termino)))
            (local.set $di (i32.add (local.get $di) (i32.const 2)))
            (br $loop_taylor)
          )
        )
        (local.set $reps (i32.sub (local.get $reps) (i32.const 1)))
        (br $loop_bench)
      )
    )
    (local.get $suma)
  )

  ;; Test de primalidad para entero de 32 bits
  (func $es_primo (export "es_primo") (param $n i32) (result i32)
    (local $d i32)
    (if (i32.lt_u (local.get $n) (i32.const 2)) (then (return (i32.const 0))))
    (if (i32.eq  (local.get $n) (i32.const 2)) (then (return (i32.const 1))))
    (if (i32.eqz (i32.rem_u (local.get $n) (i32.const 2))) (then (return (i32.const 0))))
    (local.set $d (i32.const 3))
    (block $end
      (loop $loop
        (br_if $end
          (i32.gt_u (i32.mul (local.get $d) (local.get $d)) (local.get $n))
        )
        (if (i32.eqz (i32.rem_u (local.get $n) (local.get $d)))
          (then (return (i32.const 0)))
        )
        (local.set $d (i32.add (local.get $d) (i32.const 2)))
        (br $loop)
      )
    )
    (i32.const 1)
  )

  ;; Benchmark de primalidad INLINED (sin sobrecarga de llamadas a función por iteración)
  (func $bench_es_primo (export "bench_es_primo") (param $n i32) (param $reps i32) (result i32)
    (local $r i32)
    (local $d i32)
    (block $end_bench
      (loop $loop_bench
        (br_if $end_bench (i32.eqz (local.get $reps)))
        ;; Comprobación inlined de primalidad
        (block $done_primo
          (if (i32.lt_u (local.get $n) (i32.const 2))
            (then (local.set $r (i32.const 0)) (br $done_primo))
          )
          (if (i32.eq (local.get $n) (i32.const 2))
            (then (local.set $r (i32.const 1)) (br $done_primo))
          )
          (if (i32.eqz (i32.rem_u (local.get $n) (i32.const 2)))
            (then (local.set $r (i32.const 0)) (br $done_primo))
          )
          (local.set $d (i32.const 3))
          (local.set $r (i32.const 1))
          (block $end_check
            (loop $loop_check
              (br_if $end_check
                (i32.gt_u (i32.mul (local.get $d) (local.get $d)) (local.get $n))
              )
              (if (i32.eqz (i32.rem_u (local.get $n) (local.get $d)))
                (then
                  (local.set $r (i32.const 0))
                  (br $end_check)
                )
              )
              (local.set $d (i32.add (local.get $d) (i32.const 2)))
              (br $loop_check)
            )
          )
        )
        (local.set $reps (i32.sub (local.get $reps) (i32.const 1)))
        (br $loop_bench)
      )
    )
    (local.get $r)
  )

)
