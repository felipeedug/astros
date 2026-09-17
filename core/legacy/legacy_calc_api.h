#pragma once

#include <string>

namespace astro_legacy {

std::string ComputeNatalChartJson(const std::string& name,
                                  const std::string& date,
                                  const std::string& time,
                                  const std::string& place);

}  // namespace astro_legacy
