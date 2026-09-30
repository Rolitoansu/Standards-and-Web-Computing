#include <cmath>
#include <cstdint>

#define PI 3.14159265358979323846
#define RADIO_TIERRA_KM 6371.0
#define GRADOS_A_RAD(deg) ((deg) * (PI / 180.0))
#define RAD_A_GRADOS(rad) ((rad) * (180.0 / PI))

extern "C" {

/**
 * Calcula la latitud geodésica de destino dada una posición inicial, rumbo y distancia.
 */
double dest_lat(double lat, double lon, double rumbo_deg, double dist_km) {
    double d_rad = dist_km / RADIO_TIERRA_KM;
    double r_rad = GRADOS_A_RAD(rumbo_deg);
    double lat_rad = GRADOS_A_RAD(lat);

    double lat2_rad = std::asin(
        std::sin(lat_rad) * std::cos(d_rad) +
        std::cos(lat_rad) * std::sin(d_rad) * std::cos(r_rad)
    );

    return RAD_A_GRADOS(lat2_rad);
}

/**
 * Calcula la longitud geodésica de destino dada una posición inicial, rumbo y distancia.
 */
double dest_lon(double lat, double lon, double rumbo_deg, double dist_km) {
    double d_rad = dist_km / RADIO_TIERRA_KM;
    double r_rad = GRADOS_A_RAD(rumbo_deg);
    double lat_rad = GRADOS_A_RAD(lat);

    double lat2_rad = std::asin(
        std::sin(lat_rad) * std::cos(d_rad) +
        std::cos(lat_rad) * std::sin(d_rad) * std::cos(r_rad)
    );

    double lon2_rad = GRADOS_A_RAD(lon) + std::atan2(
        std::sin(r_rad) * std::sin(d_rad) * std::cos(lat_rad),
        std::cos(d_rad) - std::sin(lat_rad) * std::sin(lat2_rad)
    );

    return RAD_A_GRADOS(lon2_rad);
}

/**
 * Calcula el área de cobertura del cono de dispersión eólica de ceniza volcánica (km²).
 */
double plume_area(double dist_km, double apertura_deg) {
    // Área de sector circular = 0.5 * r^2 * theta (en radianes)
    double theta_rad = GRADOS_A_RAD(apertura_deg);
    return 0.5 * dist_km * dist_km * theta_rad;
}

/**
 * Función intensiva de cálculo para benchmarking de rendimiento contra JS / TS.
 * Ejecuta N iteraciones de interpolación poligonal geodésica.
 */
double benchmark_geodesy(double lat, double lon, double rumbo_deg, double dist_km, int32_t iteraciones) {
    double acum = 0.0;
    for (int32_t i = 0; i < iteraciones; ++i) {
        double rumbo_var = rumbo_deg + (i % 360);
        double dist_var = dist_km + (i % 50);
        acum += dest_lat(lat, lon, rumbo_var, dist_var);
        acum += dest_lon(lat, lon, rumbo_var, dist_var);
    }
    return acum;
}

}
