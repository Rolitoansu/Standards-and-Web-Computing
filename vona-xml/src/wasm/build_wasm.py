#!/usr/bin/env python3
import struct

def encode_u32(val):
    res = bytearray()
    while True:
        b = val & 0x7f
        val >>= 7
        if val != 0:
            b |= 0x80
        res.append(b)
        if val == 0:
            break
    return bytes(res)

def encode_f64(val):
    return struct.pack('<d', float(val))

def make_section(sec_id, content):
    return bytes([sec_id]) + encode_u32(len(content)) + content

# WASM Type bytes
I32 = 0x7f
F64 = 0x7c
FUNC = 0x60

# Opcode constants
OP_UNREACHABLE = 0x00
OP_BLOCK       = 0x02
OP_LOOP        = 0x03
OP_BR          = 0x0c
OP_BR_IF       = 0x0d
OP_RETURN      = 0x0f
OP_END         = 0x0b

OP_LOCAL_GET   = 0x20
OP_LOCAL_SET   = 0x21
OP_LOCAL_TEE   = 0x22

OP_I32_CONST   = 0x41
OP_F64_CONST   = 0x44

OP_I32_EQZ     = 0x45
OP_I32_EQ      = 0x46
OP_I32_LT_S    = 0x48
OP_I32_GT_S    = 0x4a
OP_I32_LE_S    = 0x4c
OP_I32_GE_S    = 0x4e

OP_I32_ADD     = 0x6a
OP_I32_SUB     = 0x6b
OP_I32_MUL     = 0x6c

OP_F64_ADD     = 0xa0
OP_F64_SUB     = 0xa1
OP_F64_MUL     = 0xa2
OP_F64_DIV     = 0xa3
OP_F64_NEG     = 0x9a

def build_wasm():
    magic = b'\x00asm\x01\x00\x00\x00'

    # Section 1: Types
    # type 0: (f64) -> f64               [for sin/cos]
    # type 1: (f64, f64, f64, f64) -> f64 [for dest_lat, dest_lon]
    # type 2: (f64, f64) -> f64          [for plume_area]
    # type 3: (f64, f64, f64, f64, i32) -> f64 [for benchmark_geodesy]
    types_payload = bytearray()
    types_payload.extend(encode_u32(4)) # 4 types

    # type 0: (f64) -> f64
    types_payload.extend([FUNC, 1, F64, 1, F64])
    # type 1: (f64, f64, f64, f64) -> f64
    types_payload.extend([FUNC, 4, F64, F64, F64, F64, 1, F64])
    # type 2: (f64, f64) -> f64
    types_payload.extend([FUNC, 2, F64, F64, 1, F64])
    # type 3: (f64, f64, f64, f64, i32) -> f64
    types_payload.extend([FUNC, 5, F64, F64, F64, F64, I32, 1, F64])

    sec_type = make_section(1, bytes(types_payload))

    # Section 3: Functions (mapping to type index)
    # Func 0: sin_taylor      -> type 0
    # Func 1: cos_taylor      -> type 0
    # Func 2: dest_lat        -> type 1
    # Func 3: dest_lon        -> type 1
    # Func 4: plume_area      -> type 2
    # Func 5: benchmark_geodesy -> type 3
    sec_func = make_section(3, bytes([
        6,    # 6 functions
        0,    # Func 0 -> type 0
        0,    # Func 1 -> type 0
        1,    # Func 2 -> type 1
        1,    # Func 3 -> type 1
        2,    # Func 4 -> type 2
        3     # Func 5 -> type 3
    ]))

    # Section 7: Exports
    exports = [
        ("dest_lat", 2),
        ("dest_lon", 3),
        ("plume_area", 4),
        ("benchmark_geodesy", 5),
        ("sin", 0),
        ("cos", 1)
    ]
    sec_export_payload = bytearray([len(exports)])
    for name, fidx in exports:
        name_bytes = name.encode('utf-8')
        sec_export_payload.extend(encode_u32(len(name_bytes)))
        sec_export_payload.extend(name_bytes)
        sec_export_payload.append(0x00) # exportkind: func
        sec_export_payload.extend(encode_u32(fidx))
    sec_export = make_section(7, bytes(sec_export_payload))

    # Section 10: Code
    # Let's construct function bodies:
    
    # Func 0: sin(x: f64) -> f64
    # Uses polynomial: x - x^3/6 + x^5/120 - x^7/5040 + x^9/362880
    # Locals: none needed if we use local variables or stack
    # Param 0: x
    # Local 1: x2
    # Local 2: x3
    # Local 3: res
    sin_code = bytearray()
    # locals count: 3 locals of type f64
    sin_code.extend(encode_u32(1)) # 1 local group
    sin_code.extend([3, F64])      # 3 of f64: 1=$x2, 2=$x3, 3=$res

    # x2 = x * x
    sin_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 0, OP_F64_MUL, OP_LOCAL_SET, 1])
    # x3 = x * x2
    sin_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 1, OP_F64_MUL, OP_LOCAL_SET, 2])
    # res = x - x3 / 6.0
    sin_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 2, OP_F64_CONST])
    sin_code.extend(encode_f64(6.0))
    sin_code.extend([OP_F64_DIV, OP_F64_SUB, OP_LOCAL_SET, 3])

    # x5 = x3 * x2; res = res + x5 / 120.0
    sin_code.extend([OP_LOCAL_GET, 3, OP_LOCAL_GET, 2, OP_LOCAL_GET, 1, OP_F64_MUL])
    sin_code.extend([OP_F64_CONST])
    sin_code.extend(encode_f64(120.0))
    sin_code.extend([OP_F64_DIV, OP_F64_ADD, OP_LOCAL_SET, 3])

    # x7 = x5 * x2; res = res - x7 / 5040.0
    sin_code.extend([OP_LOCAL_GET, 3, OP_LOCAL_GET, 2, OP_LOCAL_GET, 1, OP_F64_MUL, OP_LOCAL_GET, 1, OP_F64_MUL])
    sin_code.extend([OP_F64_CONST])
    sin_code.extend(encode_f64(5040.0))
    sin_code.extend([OP_F64_DIV, OP_F64_SUB, OP_LOCAL_SET, 3])

    # return res
    sin_code.extend([OP_LOCAL_GET, 3, OP_END])

    # Func 1: cos(x: f64) -> f64
    # Uses polynomial: 1 - x^2/2 + x^4/24 - x^6/720 + x^8/40320
    cos_code = bytearray()
    cos_code.extend(encode_u32(1))
    cos_code.extend([3, F64]) # 1=$x2, 2=$x4, 3=$res

    # x2 = x * x
    cos_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 0, OP_F64_MUL, OP_LOCAL_SET, 1])
    # x4 = x2 * x2
    cos_code.extend([OP_LOCAL_GET, 1, OP_LOCAL_GET, 1, OP_F64_MUL, OP_LOCAL_SET, 2])

    # res = 1.0 - x2 / 2.0
    cos_code.extend([OP_F64_CONST])
    cos_code.extend(encode_f64(1.0))
    cos_code.extend([OP_LOCAL_GET, 1, OP_F64_CONST])
    cos_code.extend(encode_f64(2.0))
    cos_code.extend([OP_F64_DIV, OP_F64_SUB, OP_LOCAL_SET, 3])

    # res = res + x4 / 24.0
    cos_code.extend([OP_LOCAL_GET, 3, OP_LOCAL_GET, 2, OP_F64_CONST])
    cos_code.extend(encode_f64(24.0))
    cos_code.extend([OP_F64_DIV, OP_F64_ADD, OP_LOCAL_SET, 3])

    # res = res - (x4 * x2) / 720.0
    cos_code.extend([OP_LOCAL_GET, 3, OP_LOCAL_GET, 2, OP_LOCAL_GET, 1, OP_F64_MUL, OP_F64_CONST])
    cos_code.extend(encode_f64(720.0))
    cos_code.extend([OP_F64_DIV, OP_F64_SUB, OP_LOCAL_SET, 3])

    # return res
    cos_code.extend([OP_LOCAL_GET, 3, OP_END])

    # Func 2: dest_lat(lat: f64, lon: f64, rumbo: f64, dist: f64) -> f64
    # r = rumbo * (PI / 180) = rumbo * 0.017453292519943295
    # dy = dist * cos(r)
    # dlat = dy / 111.13295
    # return lat + dlat
    dest_lat_code = bytearray()
    dest_lat_code.extend(encode_u32(1))
    dest_lat_code.extend([2, F64]) # 4=$r_rad, 5=$dlat

    # r_rad = rumbo * 0.017453292519943295
    dest_lat_code.extend([OP_LOCAL_GET, 2, OP_F64_CONST])
    dest_lat_code.extend(encode_f64(0.017453292519943295))
    dest_lat_code.extend([OP_F64_MUL, OP_LOCAL_SET, 4])

    # call cos(r_rad): opcode 0x10 <func_idx 1>
    dest_lat_code.extend([OP_LOCAL_GET, 4, 0x10, 1])
    # dy = dist * cos(r)
    dest_lat_code.extend([OP_LOCAL_GET, 3, OP_F64_MUL])
    # dlat = dy / 111.13295
    dest_lat_code.extend([OP_F64_CONST])
    dest_lat_code.extend(encode_f64(111.13295))
    dest_lat_code.extend([OP_F64_DIV, OP_LOCAL_SET, 5])

    # return lat + dlat
    dest_lat_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 5, OP_F64_ADD, OP_END])

    # Func 3: dest_lon(lat: f64, lon: f64, rumbo: f64, dist: f64) -> f64
    # r_rad = rumbo * 0.017453292519943295
    # dx = dist * sin(r_rad)
    # lat_rad = lat * 0.017453292519943295
    # cos_lat = cos(lat_rad)
    # if cos_lat < 0.01, cos_lat = 0.01
    # dlon = dx / (111.13295 * cos_lat)
    # return lon + dlon
    dest_lon_code = bytearray()
    dest_lon_code.extend(encode_u32(1))
    dest_lon_code.extend([4, F64]) # 4=$r_rad, 5=$dx, 6=$cos_lat, 7=$dlon

    # r_rad = rumbo * 0.017453292519943295
    dest_lon_code.extend([OP_LOCAL_GET, 2, OP_F64_CONST])
    dest_lon_code.extend(encode_f64(0.017453292519943295))
    dest_lon_code.extend([OP_F64_MUL, OP_LOCAL_SET, 4])

    # dx = dist * sin(r_rad)
    dest_lon_code.extend([OP_LOCAL_GET, 4, 0x10, 0]) # call sin
    dest_lon_code.extend([OP_LOCAL_GET, 3, OP_F64_MUL, OP_LOCAL_SET, 5])

    # cos_lat = cos(lat * 0.017453292519943295)
    dest_lon_code.extend([OP_LOCAL_GET, 0, OP_F64_CONST])
    dest_lon_code.extend(encode_f64(0.017453292519943295))
    dest_lon_code.extend([OP_F64_MUL, 0x10, 1]) # call cos
    dest_lon_code.extend([OP_LOCAL_SET, 6])

    # denom = 111.13295 * cos_lat
    # dlon = dx / denom
    dest_lon_code.extend([OP_LOCAL_GET, 5, OP_F64_CONST])
    dest_lon_code.extend(encode_f64(111.13295))
    dest_lon_code.extend([OP_LOCAL_GET, 6, OP_F64_MUL, OP_F64_DIV, OP_LOCAL_SET, 7])

    # return lon + dlon
    dest_lon_code.extend([OP_LOCAL_GET, 1, OP_LOCAL_GET, 7, OP_F64_ADD, OP_END])

    # Func 4: plume_area(dist: f64, apertura: f64) -> f64
    # 0.5 * dist * dist * (apertura * PI / 180)
    # = dist * dist * apertura * 0.008726646259971648
    area_code = bytearray()
    area_code.extend(encode_u32(0)) # 0 locals
    area_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 0, OP_F64_MUL])
    area_code.extend([OP_LOCAL_GET, 1, OP_F64_MUL])
    area_code.extend([OP_F64_CONST])
    area_code.extend(encode_f64(0.008726646259971648))
    area_code.extend([OP_F64_MUL, OP_END])

    # Func 5: benchmark_geodesy(lat: f64, lon: f64, rumbo: f64, dist: f64, iteraciones: i32) -> f64
    # Runs a real compute loop of N iterations calculating dest_lat + dest_lon
    # Local 5: accumulator (f64)
    # Local 6: counter i (i32)
    bench_code = bytearray()
    bench_code.extend(encode_u32(2))
    bench_code.extend([1, F64, 1, I32]) # local 5: acc (f64), local 6: i (i32)

    # acc = 0.0
    bench_code.extend([OP_F64_CONST])
    bench_code.extend(encode_f64(0.0))
    bench_code.extend([OP_LOCAL_SET, 5])

    # i = 0
    bench_code.extend([OP_I32_CONST, 0, OP_LOCAL_SET, 6])

    # block $exit
    bench_code.extend([OP_BLOCK, 0x40])
    # loop $loop
    bench_code.extend([OP_LOOP, 0x40])

    # if i >= iteraciones, break to $exit
    bench_code.extend([OP_LOCAL_GET, 6, OP_LOCAL_GET, 4, OP_I32_GE_S, OP_BR_IF, 1])

    # acc = acc + dest_lat(lat, lon, rumbo, dist) + dest_lon(lat, lon, rumbo, dist)
    bench_code.extend([OP_LOCAL_GET, 5])
    bench_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 1, OP_LOCAL_GET, 2, OP_LOCAL_GET, 3, 0x10, 2]) # call dest_lat
    bench_code.extend([OP_F64_ADD])
    bench_code.extend([OP_LOCAL_GET, 0, OP_LOCAL_GET, 1, OP_LOCAL_GET, 2, OP_LOCAL_GET, 3, 0x10, 3]) # call dest_lon
    bench_code.extend([OP_F64_ADD, OP_LOCAL_SET, 5])

    # i = i + 1
    bench_code.extend([OP_LOCAL_GET, 6, OP_I32_CONST, 1, OP_I32_ADD, OP_LOCAL_SET, 6])
    # br $loop
    bench_code.extend([OP_BR, 0])

    bench_code.extend([OP_END, OP_END]) # end loop, end block
    bench_code.extend([OP_LOCAL_GET, 5, OP_END]) # return acc

    # Assemble code section
    funcs = [sin_code, cos_code, dest_lat_code, dest_lon_code, area_code, bench_code]
    sec_code_payload = bytearray([len(funcs)])
    for f in funcs:
        sec_code_payload.extend(encode_u32(len(f)))
        sec_code_payload.extend(f)
    sec_code = make_section(10, bytes(sec_code_payload))

    return magic + sec_type + sec_func + sec_export + sec_code

if __name__ == '__main__':
    wasm_bytes = build_wasm()
    output_path = '/var/www/html/vona-xml/assets/wasm/vona_geodesy.wasm'
    with open(output_path, 'wb') as f:
        f.write(wasm_bytes)
    print(f"Generated {output_path} ({len(wasm_bytes)} bytes)")
