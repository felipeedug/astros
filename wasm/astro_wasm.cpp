#include <emscripten/bind.h>
#include <string>

#include "../core/legacy/legacy_calc_api.h"

namespace em = emscripten;

namespace {

std::string ComputeJsonApi(const std::string& name, const std::string& date, const std::string& time, const std::string& place) {
  return astro_legacy::ComputeNatalChartJson(name, date, time, place);
}

}  // namespace

EMSCRIPTEN_BINDINGS(astro_wasm_api) {
  em::function("computeJsonApi", &ComputeJsonApi);
}
