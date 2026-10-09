#pragma once

#include <string>

namespace astro_legacy {

std::string ComputeNatalChartJson(const std::string& name,
                                  const std::string& date,
                                  const std::string& time,
                                  const std::string& place,
                                  bool daylightSaving,
                                  double latitude,
                                  double longitude,
                                  double utcOffset);

std::string ComputeEphemerisMonthJson(int year, int month, double utcOffset, double hour);

std::string ComputeVoidMoonJson(int year, int month, double utcOffset);

}  // namespace astro_legacy
