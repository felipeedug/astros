#include <emscripten/bind.h>
#include <string>

#include "../core/legacy/legacy_calc_api.h"

namespace em = emscripten;

namespace {

std::string ComputeJsonApi(const std::string& name, const std::string& date, const std::string& time, const std::string& place, bool daylightSaving, double latitude, double longitude, double utcOffset) {
  return astro_legacy::ComputeNatalChartJson(name, date, time, place, daylightSaving, latitude, longitude, utcOffset);
}

std::string EphemerisMonthApi(int year, int month, double utcOffset, double hour) {
  return astro_legacy::ComputeEphemerisMonthJson(year, month, utcOffset, hour);
}

std::string VoidMoonApi(int year, int month, double utcOffset) {
  return astro_legacy::ComputeVoidMoonJson(year, month, utcOffset);
}

}  // namespace

EMSCRIPTEN_BINDINGS(astro_wasm_api) {
  em::function("computeJsonApi", &ComputeJsonApi);
  em::function("ephemerisMonthApi", &EphemerisMonthApi);
  em::function("voidMoonApi", &VoidMoonApi);
}
