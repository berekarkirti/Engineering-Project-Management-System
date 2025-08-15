export const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return "N/A"
  return `₹${(value / 100000).toFixed(1)}L`
}

export const calculateOverallProjectProgress = (progressTracking) => {
  if (!progressTracking || progressTracking.length === 0) return 0

  const totalWeightedProgress = progressTracking.reduce((sum, item) => {
    return sum + item.progress_percentage * item.weight
  }, 0)

  const totalWeight = progressTracking.reduce((sum, item) => sum + item.weight, 0)

  return totalWeight > 0 ? Math.round(totalWeightedProgress / totalWeight) : 0
}

export const getProgressColor = (percentage) => {
  if (percentage >= 80) return "bg-green-500"
  if (percentage >= 60) return "bg-blue-500"
  if (percentage >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export const getPhaseStatus = (progress) => {
  if (progress >= 100) return "completed"
  if (progress > 0) return "in-progress"
  return "pending"
}

export const getStatusText = (progress) => {
  if (progress >= 100) return "Completed"
  if (progress > 0) return `${progress}% Complete`
  return "Pending"
}

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "text-red-600"
    case "medium":
      return "text-orange-600"
    case "low":
      return "text-green-600"
    default:
      return "text-gray-600"
  }
}

export const getDeviationStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "text-orange-600"
    case "resolved":
      return "text-green-600"
    case "closed":
      return "text-gray-600"
    default:
      return "text-blue-600"
  }
}

export const getTpiResultColor = (result) => {
  switch (result?.toLowerCase()) {
    case "approved":
      return "text-green-600"
    case "rejected":
      return "text-red-600"
    case "conditional approval":
      return "text-orange-600"
    default:
      return "text-gray-600"
  }
}
