"""
Anatomical Skeleton Overlay Generator - Hollow Outline Style
Creates line-drawing skeleton overlays (outlines only, no fills)
Excludes: Head, neck, hands, feet
Includes: Thoracic/lumbar spine, ribcage, sternum, scapulae, clavicles, pelvis, limb bones
"""
import cv2
import numpy as np
from typing import Tuple, List, Optional

# Type aliases
Point = Tuple[int, int]
Color = Tuple[int, int, int]

class AnatomicalSkeletonRenderer:
    """Renders hollow outline skeleton overlays on images"""

    def __init__(self, image: np.ndarray, landmarks: list):
        self.image = image.copy()
        self.overlay = image.copy()
        self.h, self.w = image.shape[:2]
        self.landmarks = landmarks
        self.scale = self.w / 500  # Increased base scale for larger bones

        # WHITE color for maximum visibility
        self.LINE_COLOR = (255, 255, 255)  # White outline
        self.LINE_THICKNESS = max(2, int(2.5 * self.scale))  # Thicker lines (2-3+ pixels)

        # Extract all landmark positions
        self._extract_landmarks()

    def _extract_landmarks(self):
        """Extract pixel coordinates from MediaPipe landmarks"""
        def get_pt(idx: int) -> Point:
            lm = self.landmarks[idx]
            return (int(lm.x * self.w), int(lm.y * self.h))

        # Shoulders
        self.left_shoulder, self.right_shoulder = get_pt(11), get_pt(12)

        # Calculate neck/spine top (but we won't draw neck)
        self.shoulder_center = ((self.left_shoulder[0] + self.right_shoulder[0]) // 2,
                                (self.left_shoulder[1] + self.right_shoulder[1]) // 2)

        # Arms
        self.left_elbow, self.right_elbow = get_pt(13), get_pt(14)
        self.left_wrist, self.right_wrist = get_pt(15), get_pt(16)

        # Hips
        self.left_hip, self.right_hip = get_pt(23), get_pt(24)
        self.pelvis_center = ((self.left_hip[0] + self.right_hip[0]) // 2,
                              (self.left_hip[1] + self.right_hip[1]) // 2)

        # Legs
        self.left_knee, self.right_knee = get_pt(25), get_pt(26)
        self.left_ankle, self.right_ankle = get_pt(27), get_pt(28)

        # Spine region (thoracic starts at shoulder level, lumbar ends at pelvis)
        self.spine_top = (self.shoulder_center[0], self.shoulder_center[1] + int(10 * self.scale))
        self.spine_bottom = self.pelvis_center

        # Body proportions for scaling
        self.torso_height = abs(self.spine_bottom[1] - self.spine_top[1])
        self.shoulder_width = abs(self.right_shoulder[0] - self.left_shoulder[0])

    def _draw_bone_outline(self, pt1: Point, pt2: Point, width: int,
                           end1_width: float = 1.6, end2_width: float = 1.6):
        """Draw hollow outline of a long bone (no fill) - SCALED UP for visibility"""
        dx = pt2[0] - pt1[0]
        dy = pt2[1] - pt1[1]
        length = np.sqrt(dx*dx + dy*dy)
        if length < 1:
            return

        # Unit vectors
        ux, uy = dx/length, dy/length
        nx, ny = -uy, ux

        # Scale up width for better body proportion matching
        width = int(width * 1.4)  # 40% larger bones

        # Create bone outline with wider ends (more pronounced epiphyses)
        pts = []
        for t in np.linspace(0, 1, 30):  # More points for smoother curves
            # Width varies - wider at ends (epiphyses), narrower in middle (diaphysis)
            if t < 0.15:
                w = width * (end1_width - (end1_width - 1) * (t / 0.15))
            elif t > 0.85:
                w = width * (1 + (end2_width - 1) * ((t - 0.85) / 0.15))
            else:
                w = width

            x = pt1[0] + t * dx
            y = pt1[1] + t * dy
            pts.append([x + nx * w, y + ny * w])

        # Return path for other side (creates closed outline)
        for t in np.linspace(1, 0, 30):
            if t < 0.15:
                w = width * (end1_width - (end1_width - 1) * (t / 0.15))
            elif t > 0.85:
                w = width * (1 + (end2_width - 1) * ((t - 0.85) / 0.15))
            else:
                w = width

            x = pt1[0] + t * dx
            y = pt1[1] + t * dy
            pts.append([x - nx * w, y - ny * w])

        pts = np.array(pts, dtype=np.int32)

        # OUTLINE ONLY - no fill, with anti-aliasing
        cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def _draw_joint_circle(self, center: Point, radius: int):
        """Draw hollow joint circle (outline only) - SCALED UP"""
        scaled_radius = int(radius * 1.4)  # 40% larger joints
        cv2.circle(self.overlay, center, scaled_radius, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_spine(self):
        """Draw vertebral column outline - thoracic and lumbar only (no cervical/neck)"""
        top = self.spine_top
        bottom = self.spine_bottom
        total_length = np.sqrt((bottom[0]-top[0])**2 + (bottom[1]-top[1])**2)

        # Only draw thoracic (12) and lumbar (5) = 17 vertebrae
        # Skip cervical (neck) as requested
        num_vertebrae = 17
        vertebra_spacing = total_length / num_vertebrae

        for i in range(num_vertebrae):
            t = i / num_vertebrae
            x = int(top[0] + t * (bottom[0] - top[0]))
            y = int(top[1] + t * (bottom[1] - top[1]))

            # Vertebra size - thoracic (first 12) smaller, lumbar (last 5) larger
            is_lumbar = i >= 12
            vw = int(8 * self.scale) if is_lumbar else int(6 * self.scale)
            vh = int(vertebra_spacing * 0.7)

            # Draw vertebra body as hollow rectangle outline
            pts = np.array([
                [x - vw, y - vh//2],
                [x + vw, y - vh//2],
                [x + vw, y + vh//2],
                [x - vw, y + vh//2]
            ], dtype=np.int32)
            cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Spinous process (small line projecting back)
            sp_len = int(6 * self.scale) if is_lumbar else int(8 * self.scale)
            cv2.line(self.overlay, (x, y + vh//2), (x, y + vh//2 + sp_len),
                    self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Transverse processes for thoracic (where ribs attach)
            if not is_lumbar:
                tp_len = int(10 * self.scale)
                cv2.line(self.overlay, (x - vw, y), (x - vw - tp_len, y),
                        self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)
                cv2.line(self.overlay, (x + vw, y), (x + vw + tp_len, y),
                        self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_ribcage(self):
        """Draw 12 pairs of ribs and sternum - outline only"""
        # Sternum position
        sternum_top = (self.shoulder_center[0], self.shoulder_center[1] + int(15 * self.scale))
        sternum_bottom_y = self.spine_top[1] + int(self.torso_height * 0.55)
        sternum_width = int(8 * self.scale)

        # Draw sternum outline (manubrium + body + xiphoid)
        # Manubrium
        manubrium_h = int(20 * self.scale)
        pts = np.array([
            [sternum_top[0] - sternum_width, sternum_top[1]],
            [sternum_top[0] + sternum_width, sternum_top[1]],
            [sternum_top[0] + sternum_width - 2, sternum_top[1] + manubrium_h],
            [sternum_top[0] - sternum_width + 2, sternum_top[1] + manubrium_h]
        ], dtype=np.int32)
        cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

        # Sternum body
        body_top = sternum_top[1] + manubrium_h
        body_bottom = sternum_bottom_y - int(10 * self.scale)
        pts = np.array([
            [sternum_top[0] - sternum_width + 2, body_top],
            [sternum_top[0] + sternum_width - 2, body_top],
            [sternum_top[0] + sternum_width - 4, body_bottom],
            [sternum_top[0] - sternum_width + 4, body_bottom]
        ], dtype=np.int32)
        cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

        # Xiphoid process (small line)
        cv2.line(self.overlay, (sternum_top[0], body_bottom),
                (sternum_top[0], body_bottom + int(12 * self.scale)),
                self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

        # Calculate rib spacing - wider spacing for visibility
        rib_region_top = self.spine_top[1]
        rib_region_bottom = self.spine_top[1] + int(self.torso_height * 0.7)
        rib_spacing = (rib_region_bottom - rib_region_top) / 12

        # Draw 12 pairs of ribs with good spacing
        for i in range(12):
            spine_y = int(rib_region_top + i * rib_spacing)
            spine_x = self.shoulder_center[0]

            # Rib width decreases going down
            rib_half_width = int(self.shoulder_width * 0.5 * (1 - i * 0.025))
            rib_curve = int(25 * self.scale * (1 - i * 0.04))

            # Where rib connects to sternum (or ends for floating ribs)
            if i < 7:  # True ribs - connect to sternum
                end_y = sternum_top[1] + int((i + 1) * (body_bottom - sternum_top[1]) / 8)
            elif i < 10:  # False ribs - connect to cartilage above
                end_y = body_bottom + int((i - 6) * 8 * self.scale)
            else:  # Floating ribs - shorter
                rib_half_width = int(rib_half_width * 0.6)
                end_y = spine_y + rib_curve

            # Draw left and right ribs
            self._draw_rib_outline(spine_x, spine_y, -rib_half_width, rib_curve, end_y, i >= 10)
            self._draw_rib_outline(spine_x, spine_y, rib_half_width, rib_curve, end_y, i >= 10)

    def _draw_rib_outline(self, spine_x: int, spine_y: int, width: int, curve: int,
                          end_y: int, floating: bool):
        """Draw single rib as curved outline"""
        end_x = spine_x + width
        if floating:
            end_x = spine_x + int(width * 0.7)

        # Bezier curve for rib
        ctrl_x = spine_x + width // 2
        ctrl_y = spine_y + curve

        pts = []
        for t in np.linspace(0, 1, 25):
            x = int((1-t)**2 * spine_x + 2*(1-t)*t * ctrl_x + t**2 * end_x)
            y = int((1-t)**2 * spine_y + 2*(1-t)*t * ctrl_y + t**2 * end_y)
            pts.append([x, y])

        pts = np.array(pts, dtype=np.int32)
        cv2.polylines(self.overlay, [pts], False, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_scapulae(self):
        """Draw shoulder blades (scapulae) - outline only"""
        scap_height = int(self.torso_height * 0.35)
        scap_width = int(self.shoulder_width * 0.3)

        for shoulder, side in [(self.left_shoulder, -1), (self.right_shoulder, 1)]:
            # Triangular scapula shape
            sup_angle = (shoulder[0] - side * int(scap_width * 0.4), shoulder[1] - int(scap_height * 0.15))
            inf_angle = (shoulder[0] - side * int(scap_width * 0.5), shoulder[1] + scap_height)
            lat_angle = (shoulder[0] + side * int(scap_width * 0.2), shoulder[1] + int(5 * self.scale))

            # Scapula outline only
            pts = np.array([sup_angle, inf_angle, lat_angle], dtype=np.int32)
            cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Spine of scapula
            spine_start = (sup_angle[0] + side * int(scap_width * 0.15), sup_angle[1] + int(scap_height * 0.2))
            cv2.line(self.overlay, spine_start, lat_angle, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Acromion process
            acromion = (shoulder[0] + side * int(12 * self.scale), shoulder[1] - int(8 * self.scale))
            cv2.line(self.overlay, lat_angle, acromion, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_clavicles(self):
        """Draw collar bones - outline only with S-curve"""
        for shoulder, side in [(self.left_shoulder, -1), (self.right_shoulder, 1)]:
            sternum_pt = (self.shoulder_center[0] + side * int(8 * self.scale),
                         self.shoulder_center[1] - int(5 * self.scale))

            # S-curve control points
            ctrl1 = (sternum_pt[0] + side * abs(shoulder[0] - sternum_pt[0])//3,
                    sternum_pt[1] - int(12 * self.scale))
            ctrl2 = (sternum_pt[0] + side * abs(shoulder[0] - sternum_pt[0])*2//3,
                    sternum_pt[1] + int(8 * self.scale))

            # Draw S-curved clavicle outline
            pts = []
            for t in np.linspace(0, 1, 30):
                x = int((1-t)**3 * sternum_pt[0] + 3*(1-t)**2*t * ctrl1[0] +
                       3*(1-t)*t**2 * ctrl2[0] + t**3 * shoulder[0])
                y = int((1-t)**3 * sternum_pt[1] + 3*(1-t)**2*t * ctrl1[1] +
                       3*(1-t)*t**2 * ctrl2[1] + t**3 * shoulder[1])
                pts.append([x, y])

            pts = np.array(pts, dtype=np.int32)
            cv2.polylines(self.overlay, [pts], False, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_pelvis(self):
        """Draw pelvis - outline only"""
        pelvis_width = abs(self.right_hip[0] - self.left_hip[0])
        pelvis_height = int(pelvis_width * 0.5)
        center = self.pelvis_center

        # Draw iliac crests (hip bones) - outline only
        for hip, side in [(self.left_hip, -1), (self.right_hip, 1)]:
            # Ilium fan shape
            crest_top = (hip[0] + side * int(15 * self.scale), hip[1] - int(pelvis_height * 0.5))
            crest_outer = (hip[0] + side * int(pelvis_width * 0.45), hip[1] - int(pelvis_height * 0.35))

            pts = np.array([
                crest_top,
                crest_outer,
                (hip[0] + side * int(pelvis_width * 0.4), hip[1]),
                hip,
                (hip[0] - side * int(10 * self.scale), hip[1] - int(pelvis_height * 0.25)),
            ], dtype=np.int32)
            cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Acetabulum (hip socket) - circle outline
            socket_center = (hip[0], hip[1] + int(5 * self.scale))
            cv2.circle(self.overlay, socket_center, int(10 * self.scale),
                      self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

        # Pubic symphysis outline
        pubis_y = center[1] + int(pelvis_height * 0.35)
        cv2.ellipse(self.overlay, (center[0], pubis_y), (int(12 * self.scale), int(6 * self.scale)),
                   0, 0, 180, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

        # Sacrum outline
        sacrum_top = self.spine_bottom
        sacrum_bottom = (center[0], center[1] + int(pelvis_height * 0.25))
        sacrum_width = int(18 * self.scale)
        pts = np.array([
            sacrum_top,
            (sacrum_top[0] - sacrum_width, sacrum_bottom[1]),
            sacrum_bottom,
            (sacrum_top[0] + sacrum_width, sacrum_bottom[1]),
        ], dtype=np.int32)
        cv2.polylines(self.overlay, [pts], True, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_arm_bones(self):
        """Draw humerus, radius, and ulna - SCALED UP for body proportion"""
        for side_data in [
            (self.left_shoulder, self.left_elbow, self.left_wrist, -1),
            (self.right_shoulder, self.right_elbow, self.right_wrist, 1)
        ]:
            shoulder, elbow, wrist, side = side_data

            # HUMERUS (upper arm) - LARGER width
            humerus_width = int(10 * self.scale)  # Increased from 6
            self._draw_bone_outline(shoulder, elbow, humerus_width, 1.6, 1.5)

            # Shoulder joint circle - LARGER
            self._draw_joint_circle(shoulder, int(12 * self.scale))  # Increased from 8

            # Elbow joint circle - LARGER
            self._draw_joint_circle(elbow, int(10 * self.scale))  # Increased from 7

            # RADIUS and ULNA - clearly separated, LARGER
            dx = wrist[0] - elbow[0]
            dy = wrist[1] - elbow[1]
            length = np.sqrt(dx*dx + dy*dy)
            if length < 1:
                continue

            nx, ny = -dy/length, dx/length
            separation = int(12 * self.scale)  # Increased separation

            # Radius (larger, on thumb side)
            radius_elbow = (int(elbow[0] + nx * separation), int(elbow[1] + ny * separation))
            radius_wrist = (int(wrist[0] + nx * separation * 0.7), int(wrist[1] + ny * separation * 0.7))
            self._draw_bone_outline(radius_elbow, radius_wrist, int(7 * self.scale), 1.4, 1.6)  # Increased

            # Ulna (slightly thinner, on pinky side)
            ulna_elbow = (int(elbow[0] - nx * separation), int(elbow[1] - ny * separation))
            ulna_wrist = (int(wrist[0] - nx * separation * 0.4), int(wrist[1] - ny * separation * 0.4))
            self._draw_bone_outline(ulna_elbow, ulna_wrist, int(6 * self.scale), 1.5, 1.3)  # Increased

            # Olecranon process (elbow point on ulna)
            olecranon = (int(elbow[0] - dx/length * int(14 * self.scale) - nx * separation),
                        int(elbow[1] - dy/length * int(14 * self.scale) - ny * separation))
            cv2.circle(self.overlay, olecranon, int(7 * self.scale),
                      self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Wrist end - larger circle
            cv2.circle(self.overlay, wrist, int(8 * self.scale),
                      self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    def draw_leg_bones(self):
        """Draw femur, patella, tibia, and fibula - SCALED UP for body proportion"""
        for side_data in [
            (self.left_hip, self.left_knee, self.left_ankle, -1),
            (self.right_hip, self.right_knee, self.right_ankle, 1)
        ]:
            hip, knee, ankle, side = side_data

            # FEMUR (thigh bone) - LARGER width (biggest bone in body)
            femur_width = int(14 * self.scale)  # Increased from 8
            self._draw_bone_outline(hip, knee, femur_width, 1.6, 1.7)

            # Hip joint circle - LARGER
            self._draw_joint_circle(hip, int(14 * self.scale))  # Increased from 9

            # PATELLA (kneecap) - LARGER oval outline
            patella_center = (knee[0], knee[1] - int(14 * self.scale))
            cv2.ellipse(self.overlay, patella_center, (int(12 * self.scale), int(15 * self.scale)),
                       0, 0, 360, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Knee area - LARGER
            self._draw_joint_circle(knee, int(12 * self.scale))  # Increased from 8

            # TIBIA and FIBULA - clearly separated, LARGER
            dx = ankle[0] - knee[0]
            dy = ankle[1] - knee[1]
            length = np.sqrt(dx*dx + dy*dy)
            if length < 1:
                continue

            nx, ny = -dy/length, dx/length
            separation = int(14 * self.scale)  # Increased separation

            # Tibia (larger, medial/inner side)
            tibia_knee = (int(knee[0] - nx * separation * 0.4), int(knee[1] - ny * separation * 0.4))
            tibia_ankle = (int(ankle[0] - nx * separation * 0.2), int(ankle[1] - ny * separation * 0.2))
            self._draw_bone_outline(tibia_knee, tibia_ankle, int(10 * self.scale), 1.6, 1.4)  # Increased

            # Tibial plateau outline - LARGER
            cv2.ellipse(self.overlay, tibia_knee, (int(14 * self.scale), int(7 * self.scale)),
                       0, 0, 360, self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Fibula (thinner but visible, lateral/outer side)
            fibula_start_y = knee[1] + int(18 * self.scale)
            fibula_knee = (int(knee[0] + nx * separation), int(fibula_start_y + ny * separation))
            fibula_ankle = (int(ankle[0] + nx * separation * 0.7), int(ankle[1] + ny * separation * 0.7))
            self._draw_bone_outline(fibula_knee, fibula_ankle, int(6 * self.scale), 1.3, 1.4)  # Increased

            # Lateral malleolus (fibula bump at ankle) - LARGER
            cv2.circle(self.overlay, fibula_ankle, int(7 * self.scale),
                      self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

            # Ankle end - LARGER
            cv2.circle(self.overlay, ankle, int(10 * self.scale),
                      self.LINE_COLOR, self.LINE_THICKNESS, cv2.LINE_AA)

    # NOTE: draw_hand_bones and draw_foot_bones are EXCLUDED per user request
    # No hands or feet bones drawn

    def draw_labels(self):
        """Draw anatomical labels with LONG leader lines - labels far from body"""
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.5, self.scale * 0.65)
        font_thick = max(1, int(self.scale * 1.5))

        # MUCH farther label distance - 20-25% of image width away from body
        label_dist = int(self.w * 0.22)

        # Vertical spacing to prevent label overlap
        v_spacing = int(self.h * 0.06)

        labels = [
            # Left side - labels go to the LEFT edge of image
            ("Shoulder", self.left_shoulder, (-label_dist, -v_spacing), 'left'),
            ("Elbow", self.left_elbow, (-label_dist, 0), 'left'),
            ("Wrist", self.left_wrist, (-label_dist, v_spacing//2), 'left'),
            ("Hip", self.left_hip, (-label_dist, v_spacing), 'left'),
            ("Knee", self.left_knee, (-label_dist, 0), 'left'),
            ("Ankle", self.left_ankle, (-label_dist, v_spacing//2), 'left'),
            # Right side - labels go to the RIGHT edge of image
            ("Shoulder", self.right_shoulder, (label_dist, -v_spacing), 'right'),
            ("Elbow", self.right_elbow, (label_dist, 0), 'right'),
            ("Wrist", self.right_wrist, (label_dist, v_spacing//2), 'right'),
            ("Hip", self.right_hip, (label_dist, v_spacing), 'right'),
            ("Knee", self.right_knee, (label_dist, 0), 'right'),
            ("Ankle", self.right_ankle, (label_dist, v_spacing//2), 'right'),
        ]

        for text, joint, offset, side in labels:
            label_x = joint[0] + offset[0]
            label_y = joint[1] + offset[1]

            # Keep labels within image bounds
            label_x = max(10, min(self.w - 80, label_x))
            label_y = max(20, min(self.h - 20, label_y))

            (tw, th), _ = cv2.getTextSize(text, font, font_scale, font_thick)

            # Long leader line with small circle at joint end
            cv2.circle(self.overlay, joint, 4, self.LINE_COLOR, -1, cv2.LINE_AA)  # Dot at joint
            cv2.line(self.overlay, joint, (label_x, label_y), self.LINE_COLOR,
                    max(1, self.LINE_THICKNESS - 1), cv2.LINE_AA)

            # Text position - well outside body
            if side == 'left':
                text_x = label_x - tw - 8
            else:
                text_x = label_x + 8

            # Text with dark outline for visibility on any background
            # Shadow/outline
            cv2.putText(self.overlay, text, (text_x + 1, label_y + th//2 + 1),
                       font, font_scale, (0, 0, 0), font_thick + 2, cv2.LINE_AA)
            # White text
            cv2.putText(self.overlay, text, (text_x, label_y + th//2),
                       font, font_scale, self.LINE_COLOR, font_thick, cv2.LINE_AA)

    def render(self) -> np.ndarray:
        """Render the complete anatomical skeleton - outline only, no fill"""
        # Draw all bone outlines (NO hands, NO feet, NO head/neck)
        self.draw_scapulae()       # Shoulder blades
        self.draw_spine()          # Thoracic + lumbar vertebrae
        self.draw_ribcage()        # 12 pairs of ribs + sternum
        self.draw_pelvis()         # Hip bones + sacrum
        self.draw_clavicles()      # Collar bones
        self.draw_leg_bones()      # Femur, patella, tibia, fibula
        self.draw_arm_bones()      # Humerus, radius, ulna
        self.draw_labels()         # Joint labels

        # Return overlay directly on the original image (no blending needed for outlines)
        return self.overlay


def generate_anatomical_skeleton(image: np.ndarray, landmarks) -> np.ndarray:
    """Main function to generate anatomical skeleton outline overlay"""
    renderer = AnatomicalSkeletonRenderer(image, landmarks)
    return renderer.render()

