(module

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

  (func $coseno (export "coseno") (param $x f64) (result f64)
    (local $suma    f64)
    (local $termino f64)
    (local $neg_x2  f64)
    (local $di      f64)
    (local $i       i32)
    (local.set $neg_x2  (f64.neg (f64.mul (local.get $x) (local.get $x))))
    (local.set $termino (f64.const 1.0))
    (local.set $suma    (f64.const 1.0))
    (local.set $di      (f64.const 0.0))
    (local.set $i       (i32.const 1))
    (block $end
      (loop $loop
        (br_if $end (i32.gt_u (local.get $i) (i32.const 50)))
        (local.set $di (f64.add (local.get $di) (f64.const 2.0)))
        (local.set $termino
          (f64.div
            (f64.mul (local.get $termino) (local.get $neg_x2))
            (f64.mul (f64.sub (local.get $di) (f64.const 1.0)) (local.get $di))
          )
        )
        (local.set $suma (f64.add (local.get $suma) (local.get $termino)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )
    (local.get $suma)
  )

  (func $bench_coseno (export "bench_coseno") (param $x f64) (param $reps i32) (result f64)
    (local $r f64)
    (block $end_bench
      (loop $loop_bench
        (br_if $end_bench (i32.eqz (local.get $reps)))
        (local.set $r (call $coseno (local.get $x)))
        (local.set $reps (i32.sub (local.get $reps) (i32.const 1)))
        (br $loop_bench)
      )
    )
    (local.get $r)
  )

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

)
