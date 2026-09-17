#pragma once

#include <string>
#include <utility>
#include <vector>

#include "../migration/legacy_compat.h"

namespace astro {

struct ChartPayload {
  std::string chartTitle;
  std::string centerSign;
  std::string centerDegree;
  std::string sunSign;
  std::string moonSign;
  std::string risingSign;
  std::string status;
  std::vector<std::pair<std::string, double>> planets;
};

ChartPayload ComputeFromLegacyData(const legacy::BirthData& birthData);
std::string ComputeNatalChartJson(const legacy::BirthData& birthData);

}  // namespace astro
