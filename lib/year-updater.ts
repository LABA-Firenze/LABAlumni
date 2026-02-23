/**
 * Utility functions for managing student year updates
 * Years should automatically increment on October 1st each year
 */

export function shouldUpdateYear(lastUpdate: string | null): boolean {
  if (!lastUpdate) return false

  const lastUpdateDate = new Date(lastUpdate)
  const now = new Date()
  
  // Check if we've passed October 1st since last update
  const currentYear = now.getFullYear()
  const october1 = new Date(currentYear, 9, 1) // Month is 0-indexed, so 9 = October
  
  // If we're past October 1st this year and last update was before October 1st this year
  if (now >= october1 && lastUpdateDate < october1) {
    return true
  }
  
  // If last update was in a previous year and we're past October 1st
  if (lastUpdateDate.getFullYear() < currentYear && now >= october1) {
    return true
  }
  
  return false
}

export function getUpdatedYear(currentYear: number | null, courseType: 'triennio' | 'biennio'): number | null {
  if (!currentYear) return null
  
  const maxYear = courseType === 'triennio' ? 3 : 2
  
  // Increment year, but don't exceed max
  const newYear = currentYear + 1
  return newYear > maxYear ? maxYear : newYear
}

/**
 * Function to update student years in bulk
 * Should be called by a cron job or scheduled function on October 1st
 */
export async function updateStudentYears(supabase: any) {
  try {
    // Get all students
    const { data: students, error } = await supabase
      .from('students')
      .select('id, year, course, last_year_update')
    
    if (error) throw error
    if (!students) return

    const updates: Array<{ id: string; year: number; last_year_update: string }> = []
    
    for (const student of students) {
      if (shouldUpdateYear(student.last_year_update)) {
        // Get course type from course enum
        // This is a simplified version - you'd need to map course to type
        const courseType = getCourseType(student.course)
        const newYear = getUpdatedYear(student.year, courseType)
        
        if (newYear && newYear !== student.year) {
          updates.push({
            id: student.id,
            year: newYear,
            last_year_update: new Date().toISOString(),
          })
        }
      }
    }

    // Batch update
    for (const update of updates) {
      await supabase
        .from('students')
        .update({
          year: update.year,
          last_year_update: update.last_year_update,
        })
        .eq('id', update.id)
    }

    return { updated: updates.length }
  } catch (error) {
    console.error('Error updating student years:', error)
    throw error
  }
}

function getCourseType(course: string): 'triennio' | 'biennio' {
  const biennioCourses = ['interior-design', 'cinema-audiovisivi']
  return biennioCourses.includes(course) ? 'biennio' : 'triennio'
}



