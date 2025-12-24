"use client"

import React from "react"
import Image from "next/image"
import { X, Trophy, Target, Ruler, Calendar, Award, Info } from "lucide-react"
import { type EliteShooter, TIER_LABELS, TIER_COLORS, POSITION_LABELS, LEAGUE_LABELS, LEAGUE_COLORS } from "@/data/eliteShooters"

// Player bios database - comprehensive descriptions for popup
const PLAYER_BIOS: Record<string, string> = {
  // NBA LEGENDARY
  "Stephen Curry": "Stephen Curry is widely considered the greatest shooter in NBA history. A 2x MVP and 4x NBA Champion with the Golden State Warriors, Curry revolutionized basketball with his unprecedented three-point shooting range. He holds the all-time record for career three-pointers made and has led the league in three-point shooting multiple times. His quick release, unlimited range, and ability to shoot off the dribble changed how the game is played.",
  
  "Ray Allen": "Ray Allen is a Basketball Hall of Famer and one of the purest shooters the game has ever seen. A 2x NBA Champion (Boston Celtics, Miami Heat), 10x All-Star, and former all-time leader in three-pointers made. Known for his textbook shooting form and incredible work ethic, Allen's clutch shooting in the 2013 NBA Finals is one of the most iconic moments in basketball history.",
  
  "Reggie Miller": "Reggie Miller spent his entire 18-year career with the Indiana Pacers and is known as one of the greatest clutch shooters ever. A 5x All-Star and Hall of Famer, Miller was famous for his trash-talking and ability to hit big shots in pressure moments. His 8 points in 8.9 seconds against the Knicks remains one of the most legendary performances in playoff history.",
  
  "Klay Thompson": "Klay Thompson is one half of the 'Splash Brothers' alongside Stephen Curry. A 4x NBA Champion and 5x All-Star, Thompson holds the record for most three-pointers in a single game (14) and most points in a quarter (37). Known for his catch-and-shoot ability and textbook form, he's considered one of the greatest two-way shooting guards in NBA history.",
  
  "Larry Bird": "Larry Bird is a 3x NBA Champion, 3x MVP, and Basketball Hall of Famer. Widely regarded as one of the greatest players ever, Bird was known for his incredible shooting, court vision, and competitiveness. He won three consecutive three-point contests (1986-88) and his rivalry with Magic Johnson helped save the NBA in the 1980s.",
  
  // NBA ELITE
  "Kevin Durant": "Kevin Durant is a 2x NBA Champion, MVP, and 4x scoring champion. Standing 6'10\" with guard-like skills, Durant's length and shooting ability make him virtually unguardable. He's one of the most efficient scorers in NBA history with a career average over 27 points per game.",
  
  "Dirk Nowitzki": "Dirk Nowitzki revolutionized the power forward position with his shooting ability. The 2011 NBA Champion and MVP spent his entire 21-year career with the Dallas Mavericks. His signature one-legged fadeaway is one of the most unblockable shots in basketball history.",
  
  "Steve Nash": "Steve Nash is a 2x MVP and 8x All-Star known for his incredible shooting and playmaking. One of the greatest point guards ever, Nash is a member of the exclusive 50-40-90 club (four times) and led the 'Seven Seconds or Less' Phoenix Suns teams that changed NBA offense.",
  
  "Kyle Korver": "Kyle Korver had a 17-year NBA career and is one of the greatest three-point shooters in league history. An All-Star in 2015, Korver led the league in three-point percentage four times and finished his career with over 2,450 three-pointers made.",
  
  "Damian Lillard": "Damian Lillard is a 7x All-Star and one of the most clutch players in NBA history. Known for his deep three-point range and 'Dame Time' performances, Lillard has hit multiple series-winning buzzer-beaters including his iconic shot against Oklahoma City in 2019.",
  
  "James Harden": "James Harden is a former MVP and 10x All-Star known for his scoring ability and step-back three-pointer. He's one of only a few players to average over 36 points per game in a season and has led the league in scoring three times.",
  
  "Devin Booker": "Devin Booker became the youngest player to score 70 points in a game at age 20. A 4x All-Star, Booker led the Phoenix Suns to the 2021 NBA Finals and is known for his smooth shooting stroke and mid-range game.",
  
  "Chris Paul": "Chris Paul is a 12x All-Star and one of the greatest point guards in NBA history. Known as 'The Point God,' Paul has led the league in assists and steals multiple times. His leadership and basketball IQ make him one of the most respected players of his generation.",
  
  "JJ Redick": "JJ Redick had a 15-year NBA career after being Duke's all-time leading scorer. Known for his tireless work ethic and ability to come off screens, Redick made over 1,900 career three-pointers. He's now a popular basketball analyst and podcaster.",
  
  "Joe Ingles": "Joe Ingles, nicknamed 'Slow Mo Joe,' is known for his deceptively effective game. The Australian guard spent most of his career with the Utah Jazz and is one of the best three-point shooters in franchise history despite his unassuming appearance.",
  
  "Seth Curry": "Seth Curry, Stephen's younger brother, is one of the most efficient three-point shooters in NBA history. He has shot over 44% from three for his career and has proven to be a valuable role player on multiple playoff teams.",
  
  "Duncan Robinson": "Duncan Robinson went from undrafted to one of the best shooters in the NBA. He holds the record for fastest player to 500 career three-pointers and was a key piece of the Miami Heat's 2020 Finals run.",
  
  "Buddy Hield": "Buddy Hield is one of the fastest players to reach 1,000 career three-pointers. Known for his quick release and unlimited range, Hield has been one of the league's most prolific three-point shooters since entering the NBA in 2016.",
  
  // NBA GREAT/GOOD
  "Trae Young": "Trae Young is a 3x All-Star known for his deep three-point range and elite playmaking. He led the Atlanta Hawks to the 2021 Eastern Conference Finals and has drawn comparisons to Steve Nash and Stephen Curry for his style of play.",
  
  "Luka Dončić": "Luka Dončić is a 4x All-Star and one of the most talented young players in NBA history. The Slovenian star has been named to the All-NBA First Team multiple times and led the Dallas Mavericks to the 2024 NBA Finals.",
  
  "Jayson Tatum": "Jayson Tatum is a 5x All-Star and the leader of the Boston Celtics. He led Boston to the 2024 NBA Championship and has established himself as one of the best two-way players in the league.",
  
  "Anthony Edwards": "Anthony Edwards, nicknamed 'Ant-Man,' is one of the most exciting young players in the NBA. The #1 pick in 2020, Edwards has become an All-Star and led the Minnesota Timberwolves to the Western Conference Finals in 2024.",
  
  "Donovan Mitchell": "Donovan Mitchell is a 3x All-Star known for his scoring ability and clutch performances. He's had multiple 50+ point playoff games and has established himself as one of the premier shooting guards in the league.",
  
  "CJ McCollum": "CJ McCollum is known for his smooth mid-range game and three-point shooting. A key piece of the Portland Trail Blazers' playoff teams, McCollum has been one of the most consistent scorers in the league.",
  
  "Khris Middleton": "Khris Middleton is a 3x All-Star and NBA Champion with the Milwaukee Bucks. Known for his clutch shooting and versatile scoring, Middleton was crucial to the Bucks' 2021 championship run.",
  
  "Tyler Herro": "Tyler Herro won the 2022 Sixth Man of the Year award and was a key player in the Miami Heat's playoff runs. Known for his confident shooting and ability to perform in big moments.",
  
  // MID-LEVEL
  "Jrue Holiday": "Jrue Holiday is a 2x NBA Champion and one of the best two-way guards in the league. While not known primarily as a shooter, Holiday has improved his three-point shooting throughout his career and is valued for his elite defense and playmaking.",
  
  "Russell Westbrook": "Russell Westbrook is a former MVP and the NBA's all-time leader in triple-doubles. While his shooting percentages have been inconsistent, Westbrook's athleticism, competitiveness, and playmaking have made him one of the most dynamic players of his generation.",
  
  "Ben Simmons": "Ben Simmons is a 3x All-Star and one of the best defensive players in the NBA. While his shooting has been a weakness, Simmons' court vision, passing, and defensive versatility make him a unique player.",
  
  // BAD SHOOTERS (who still take shots)
  "Draymond Green": "Draymond Green is a 4x NBA Champion and one of the greatest defenders in NBA history. While not a shooter, Green's basketball IQ, passing, and defensive versatility have been crucial to the Warriors' dynasty.",
  
  "Marcus Smart": "Marcus Smart won the 2022 Defensive Player of the Year award and is known for his toughness and leadership. While his shooting percentages are low, Smart is willing to take big shots and has hit clutch threes in playoff games.",
  
  "Rajon Rondo": "Rajon Rondo is a 2x NBA Champion known for his elite playmaking and basketball IQ. While not a shooter, Rondo's ability to run an offense and perform in the playoffs earned him the nickname 'Playoff Rondo.'",
  
  "Tony Allen": "Tony Allen is a 6x All-Defensive Team selection and one of the best perimeter defenders of his era. Known for his 'Grindfather' mentality with the Memphis Grizzlies, Allen was valued for his defense despite limited offensive skills.",
  
  "Andre Roberson": "Andre Roberson was one of the best wing defenders in the NBA during his time with the Oklahoma City Thunder. While his shooting was a significant weakness, his defensive impact was undeniable.",
  
  // WNBA
  "Diana Taurasi": "Diana Taurasi is the WNBA's all-time leading scorer and a 3x WNBA Champion. Known as the 'GOAT' of women's basketball, Taurasi has won 5 Olympic gold medals and is a 10x All-Star. Her competitive fire and shooting ability have made her the standard for excellence in women's basketball.",
  
  "Sue Bird": "Sue Bird is a 4x WNBA Champion and the league's all-time leader in assists. A 13x All-Star and 5x Olympic gold medalist, Bird spent her entire 21-year career with the Seattle Storm. She's considered one of the greatest point guards in basketball history.",
  
  "Elena Delle Donne": "Elena Delle Donne is a 2x WNBA MVP and one of the most efficient scorers in league history. She became the first WNBA player to join the 50-40-90 club and led the Washington Mystics to their first championship in 2019.",
  
  "Caitlin Clark": "Caitlin Clark is the all-time leading scorer in NCAA Division I basketball history (men's or women's). A 3x National Player of the Year at Iowa, Clark's deep three-point range and flashy playmaking made her a cultural phenomenon and helped elevate women's basketball to unprecedented popularity. She was selected #1 overall by the Indiana Fever in the 2024 WNBA Draft.",
  
  "Sabrina Ionescu": "Sabrina Ionescu is the only player in NCAA history (men's or women's) to record 2,000 points, 1,000 assists, and 1,000 rebounds. The #1 pick in 2020, she's become one of the WNBA's brightest stars with the New York Liberty and participated in a historic three-point contest against Stephen Curry.",
  
  "Breanna Stewart": "Breanna Stewart is a 2x WNBA Champion, 2x Finals MVP, and 2x league MVP. One of the most dominant players in WNBA history, Stewart has won championships at every level and is known for her versatile scoring ability.",
  
  "A'ja Wilson": "A'ja Wilson is a 2x WNBA MVP and one of the most dominant players in the league. The #1 pick in 2018, Wilson has led the Las Vegas Aces to back-to-back championships and is known for her scoring, rebounding, and defensive presence.",
  
  "Kelsey Plum": "Kelsey Plum is the NCAA Division I all-time leading scorer (women's) and a WNBA Champion. She won the 2022 All-Star Game MVP and has become one of the league's most dynamic scorers with the Las Vegas Aces.",
  
  // NCAA
  "Pete Maravich": "Pete Maravich, 'Pistol Pete,' is the all-time leading scorer in NCAA Division I history with 3,667 points and a 44.2 points per game average - records that still stand today. Playing before the three-point line existed, Maravich's ball-handling and shooting were decades ahead of his time. He was a 5x NBA All-Star and Hall of Famer.",
  
  "Stephen Curry (Davidson)": "Before becoming the greatest shooter in NBA history, Stephen Curry led Davidson to the Elite Eight in 2008, captivating the nation with his shooting displays. He averaged 28.6 points per game in his college career.",
  
  "Jimmer Fredette": "Jimmer Fredette was a consensus National Player of the Year at BYU in 2011. Known as 'Jimmer Range' for his deep three-pointers, he led the nation in scoring and became a cultural phenomenon during his senior season.",
  
  "Doug McDermott": "Doug McDermott won the Naismith Award as the best player in college basketball in 2014. He finished his career at Creighton as one of the top 10 scorers in NCAA history with over 3,000 points.",
}

// Helper to format height from inches to feet/inches
const formatHeight = (inches: number) => {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

// Generate bio for players without a custom one
const generateBio = (shooter: EliteShooter): string => {
  if (PLAYER_BIOS[shooter.name]) {
    return PLAYER_BIOS[shooter.name]
  }
  
  const tierDesc: Record<string, string> = {
    legendary: "one of the greatest shooters",
    elite: "an exceptional shooter",
    great: "a highly skilled shooter",
    good: "a reliable shooter",
    mid_level: "a capable shooter",
    bad: "a player known more for other aspects than shooting"
  }
  
  const leagueDesc: Record<string, string> = {
    NBA: "the NBA",
    WNBA: "the WNBA",
    NCAA_MEN: "NCAA Division I Men's basketball",
    NCAA_WOMEN: "NCAA Division I Women's basketball",
    TOP_COLLEGE: "college basketball"
  }
  
  let bio = `${shooter.name} played for ${shooter.team} in ${leagueDesc[shooter.league] || "professional basketball"} during the ${shooter.era} era. `
  bio += `Considered ${tierDesc[shooter.tier] || "a shooter"} of their time`
  
  if (shooter.careerPct) {
    bio += ` with a career three-point percentage of ${shooter.careerPct}%`
  }
  
  bio += ". "
  
  if (shooter.achievements) {
    bio += shooter.achievements
  }
  
  return bio
}

interface PlayerBioPopupProps {
  shooter: EliteShooter & { wsi?: number }
  onClose: () => void
}

export default function PlayerBioPopup({ shooter, onClose }: PlayerBioPopupProps) {
  const tierColor = TIER_COLORS[shooter.tier]
  const bio = shooter.bio || generateBio(shooter)
  
  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#FFD700]/30 shadow-2xl">
        {/* Header with photo */}
        <div className="relative bg-gradient-to-r from-[#FFD700]/20 to-transparent p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-6">
            {/* Player Photo */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#FFD700]/50 bg-[#3a3a3a] flex-shrink-0">
              {shooter.photoUrl ? (
                <Image
                  src={shooter.photoUrl}
                  alt={shooter.name}
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-[#FFD700]">
                    {shooter.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
              )}
            </div>
            
            {/* Player Info */}
            <div className="flex-1 pt-2">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wide">{shooter.name}</h2>
              <p className="text-[#888] text-lg mt-1">{shooter.team}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-block px-3 py-1 rounded text-xs font-semibold uppercase bg-[#3a3a3a] text-[#E5E5E5] border border-[#4a4a4a]">
                  {POSITION_LABELS[shooter.position]}
                </span>
                <span className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase bg-gradient-to-r ${LEAGUE_COLORS[shooter.league]} text-white`}>
                  {LEAGUE_LABELS[shooter.league]}
                </span>
                <span
                  className="px-3 py-1 rounded text-xs font-semibold uppercase"
                  style={{
                    backgroundColor: `${tierColor}20`,
                    border: `1px solid ${tierColor}60`,
                    color: tierColor
                  }}
                >
                  {TIER_LABELS[shooter.tier]}
                </span>
              </div>
              
              <p className="text-[#888] text-sm mt-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {shooter.era}
              </p>
            </div>
            
            {/* Score Badge */}
            <div className="flex flex-col items-center gap-1">
              <Trophy className="w-6 h-6" style={{ color: tierColor }} />
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: `${tierColor}20`, border: `3px solid ${tierColor}` }}
              >
                <span className="text-2xl font-bold" style={{ color: tierColor }}>{shooter.overallScore}</span>
              </div>
              <span className="text-xs text-[#888] font-bold">OVR</span>
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider">About {shooter.name.split(" ")[0]}</h3>
          </div>
          <p className="text-[#E5E5E5] leading-relaxed text-base">{bio}</p>
        </div>
        
        {/* Stats Grid */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 3PT% */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-green-500/30">
              <Target className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">{shooter.careerPct ? `${shooter.careerPct}%` : "—"}</p>
              <p className="text-xs text-[#888] uppercase">Career 3PT%</p>
            </div>
            
            {/* FT% */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-blue-500/30">
              <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">{Math.round(shooter.careerFreeThrowPct)}%</p>
              <p className="text-xs text-[#888] uppercase">Career FT%</p>
            </div>
            
            {/* WSI */}
            {shooter.wsi && (
              <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-purple-500/30">
                <Award className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-400">{shooter.wsi}</p>
                <p className="text-xs text-[#888] uppercase">WSI Score</p>
              </div>
            )}
            
            {/* Height */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#FFD700]/30">
              <Ruler className="w-5 h-5 text-[#FFD700] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#FFD700]">{formatHeight(shooter.height)}</p>
              <p className="text-xs text-[#888] uppercase">Height</p>
            </div>
          </div>
        </div>
        
        {/* Achievements */}
        {shooter.achievements && (
          <div className="p-6 border-t border-[#3a3a3a]">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider">Achievements</h3>
            </div>
            <p className="text-[#E5E5E5]">{shooter.achievements}</p>
          </div>
        )}
        
        {/* Key Traits */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider mb-3">Key Traits</h3>
          <div className="flex flex-wrap gap-2">
            {shooter.keyTraits.map((trait, idx) => (
              <span 
                key={idx} 
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
        
        {/* Shooting Style */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider mb-3">Shooting Style</h3>
          <p className="text-[#E5E5E5] italic">&ldquo;{shooter.shootingStyle}&rdquo;</p>
        </div>
        
        {/* Physical Stats */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <h3 className="text-lg font-bold text-[#FFD700] uppercase tracking-wider mb-3">Physical Profile</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <p className="text-xl font-bold text-[#FFD700]">{formatHeight(shooter.height)}</p>
              <p className="text-xs text-[#888] uppercase">Height</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <p className="text-xl font-bold text-[#FFD700]">{formatHeight(shooter.wingspan)}</p>
              <p className="text-xs text-[#888] uppercase">Wingspan</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-3">
              <p className="text-xl font-bold text-[#FFD700]">{shooter.weight} lbs</p>
              <p className="text-xs text-[#888] uppercase">Weight</p>
            </div>
          </div>
        </div>
        
        {/* Close Button */}
        <div className="p-6 border-t border-[#3a3a3a]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#FFD700] hover:bg-[#e5c200] text-black font-bold rounded-lg transition-colors uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}








