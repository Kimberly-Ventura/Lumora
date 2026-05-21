import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  Pressable, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { FooterHero } from '@/components/FooterHero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: windowWidth } = Dimensions.get('window');

const CATEGORIES = ['All', 'Design', 'Interiors', 'Lifestyle'];

const BLOG_POSTS = [
  {
    id: '1',
    title: 'Spatially Reimagined: The Art of Mid-Century Linen',
    subtitle: 'Textural dialogues and understated geometry',
    author: 'Julian Mercer',
    role: 'Lead Interior Curator',
    date: 'May 12, 2026',
    readTime: '5 min read',
    category: 'Design',
    image: require('@/assets/images/verona_sofa_clean.png'),
    snippet: 'Linen has transcended its origins as a rustic textile to become the defining texture of low-profile luxury. Discover how designers use raw textures to balance bold geometric furniture frames.',
    content: [
      'For decades, interior design struggled under the heavy weight of structured, synthetic upholstery. However, a quiet revolution has taken root, centering around a raw, organic weave that commands attention through its sheer simplicity: architectural linen.',
      'In our latest collection, the Verona Luxe Sofa stands as a testament to this philosophy. Built with a low-profile silhouette, its linear geometry is deliberately softened by the tactile depth of pure Belgian linen. Linen does not hide its imperfections; it celebrates them. The subtle slubs and natural color variations create an organic canvas that plays with light in a way synthetic fibers never can.',
      'When placing linen furniture in a contemporary space, curation is key. The goal is to allow the texture to breathe. We recommend pairing raw linen textures with cold materials like architectural concrete, black powder-coated steel, or polished travertine. This juxtaposition of raw organic warmness and polished industrial coldness creates a silent, luxury tension that defines modern spaces.'
    ]
  },
  {
    id: '2',
    title: 'The Sculptural Line: Brass & Solid Oak Harmony',
    subtitle: 'Finding balance between heavy oak and delicate light',
    author: 'Elena Vance',
    role: 'Principal Product Architect',
    date: 'April 28, 2026',
    readTime: '4 min read',
    category: 'Interiors',
    image: require('@/assets/images/nova_lamp_clean.png'),
    snippet: 'When solid oak meets the precision of architectural brass, a silent dialogue of weights and lights emerges. We explore the structural philosophy behind Lumora’s statement lamps.',
    content: [
      'Lighting should never be treated as an afterthought or a utility. Instead, a light source is a sculpture—a central monument that anchors a room even when unlit. Our design studio has spent months refining a signature material combination: natural solid oak and brushed structural brass.',
      'Oak represents the earth: heavy, dense, deeply grained, and permanent. Brass represents the sky: thin, reflective, precise, and conductive. By placing a slender line of golden brass directly into a block of heavy, matte-finished white oak, we achieve a literal and figurative union of opposites.',
      'To integrate sculptural lighting effectively, treat each piece as a museum installation. Give it space. A brass-and-oak lamp should not be crowded on a busy bookshelf; instead, place it on a minimalist pedestal, a raw concrete side console, or let it stand alone in a reading alcove where its physical form can be appreciated as deeply as the warm illumination it casts.'
    ]
  },
  {
    id: '3',
    title: 'Minimalist Living: How Less Becomes Luxuriously More',
    subtitle: 'The curatorial mindset of spatial planning',
    author: 'Marcus Sterling',
    role: 'Founding Design Director',
    date: 'May 04, 2026',
    readTime: '6 min read',
    category: 'Lifestyle',
    image: require('@/assets/images/lounge_chair_clean.png'),
    snippet: 'Quiet luxury is not about emptying a room; it is about filling it with absolute intention. Learn the curatorial approach to spatial planning, where single lounge chairs define entire vistas.',
    content: [
      'There is a common misconception that minimalism is cold, sterile, and void of character. True luxury minimalism—what we refer to as "Quiet Luxury"—is actually the opposite. It is warm, inviting, rich in material heritage, and extremely selective.',
      'The modern home has become overcrowded with noise. The curatorial approach to interior architecture requires you to view your living space not as a storage container for objects, but as a sanctuary for experiences. Every single element inside your visual field must serve a dual purpose: functional ease and visual harmony.',
      'Take our Aurelius Lounge Chair, for example. It is not designed to be one of four matching chairs around a crowded table. It is sculpted to stand alone as a solitary luxury statement. Placing it in an open corner alongside a simple, hand-finished oak stool and a single green stem creates a pocket of quiet contemplation. By leaving empty space around the chair, you highlight its architectural beauty and invite the mind to rest.'
    ]
  }
];

export default function BlogScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && windowWidth > 992;
  const contentWidth = isWeb ? Math.min(windowWidth, 1200) : windowWidth;
  const headerHeight = isWeb ? 70 : 110;

  const filteredPosts = BLOG_POSTS.filter(post => 
    activeCategory === 'All' || post.category.toLowerCase() === activeCategory.toLowerCase()
  );

  const activePost = BLOG_POSTS.find(post => post.id === selectedPostId);

  const handleSelectPost = (id: string) => {
    setSelectedPostId(id);
  };

  const handleBackToFeed = () => {
    setSelectedPostId(null);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: headerHeight },
          isWeb && styles.webScrollContent
        ]}
      >
        <View style={[styles.innerLayout, { width: contentWidth }]}>
          
          {/* RENDER DYNAMIC ARTICLE VIEW */}
          {activePost ? (
            <View style={styles.detailContainer}>
              {/* Back Link */}
              <Pressable onPress={handleBackToFeed} style={styles.backLinkRow}>
                <Ionicons name="arrow-back" size={16} color="#A06E50" />
                <ThemedText style={styles.backLinkText}>BACK TO JOURNAL</ThemedText>
              </Pressable>

              {/* Main Detail Content */}
              <View style={[styles.detailLayout, isDesktop && styles.desktopDetailLayout]}>
                
                {/* Text Side */}
                <View style={[styles.detailBody, isDesktop && { flex: 1, marginRight: 60 }]}>
                  <ThemedText style={styles.detailCategory}>{activePost.category.toUpperCase()}</ThemedText>
                  <ThemedText style={styles.detailTitle}>{activePost.title}</ThemedText>
                  <ThemedText style={styles.detailSubtitle}>{activePost.subtitle}</ThemedText>
                  
                  {/* Author Row */}
                  <View style={styles.authorRow}>
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarText}>{activePost.author.charAt(0)}</ThemedText>
                    </View>
                    <View>
                      <ThemedText style={styles.authorName}>{activePost.author}</ThemedText>
                      <ThemedText style={styles.authorRole}>{activePost.role}</ThemedText>
                    </View>
                    <View style={styles.dividerDot} />
                    <ThemedText style={styles.postDate}>{activePost.date}</ThemedText>
                    <View style={styles.dividerDot} />
                    <View style={styles.readTimeBadge}>
                      <Ionicons name="time-outline" size={12} color="#A06E50" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.readTimeText}>{activePost.readTime}</ThemedText>
                    </View>
                  </View>

                  {/* Body Paragraphs */}
                  <View style={styles.paragraphsContainer}>
                    {activePost.content.map((paragraph, idx) => (
                      <ThemedText key={idx} style={styles.paragraphText}>
                        {paragraph}
                      </ThemedText>
                    ))}
                  </View>
                </View>

                {/* Graphics Banner Side */}
                <View style={[styles.detailImageCard, isDesktop ? { width: 440 } : { width: '100%', marginTop: 30 }]}>
                  <View style={styles.detailImageWrapper}>
                    <Image source={activePost.image} style={styles.detailImage} resizeMode="contain" />
                  </View>
                  <View style={styles.editorialQuoteCard}>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#E7E0D8" />
                    <ThemedText style={styles.editorialQuote}>
                      "Quiet Luxury is not about showing wealth; it is about absolute clarity of form, texture, and spacing."
                    </ThemedText>
                  </View>
                </View>

              </View>
            </View>
          ) : (
            /* RENDER EDITORIAL LIST FEED */
            <View style={styles.feedContainer}>
              
              {/* Journal Title Block */}
              <View style={styles.titleContainer}>
                <ThemedText style={styles.subtitle}>EDITORIAL JOURNAL</ThemedText>
                <ThemedText style={styles.title}>The Lumora Perspective</ThemedText>
                <ThemedText style={styles.description}>
                  Explorations in spatial curation, structural material dynamics, and architectural home philosophies. Curated weekly by our global design board.
                </ThemedText>
              </View>

              {/* Category Filter Pills */}
              <View style={styles.categoriesRow}>
                {CATEGORIES.map(cat => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <Pressable
                      key={cat}
                      style={[
                        styles.categoryPill,
                        isActive && styles.categoryPillActive
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <ThemedText 
                        style={[
                          styles.categoryPillText,
                          isActive && styles.categoryPillTextActive
                        ]}
                      >
                        {cat}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Articles Grid Feed */}
              <View style={[styles.postsGrid, isDesktop && styles.desktopPostsGrid]}>
                {filteredPosts.map(post => (
                  <Pressable
                    key={post.id}
                    style={[styles.postCard, { backgroundColor: '#FFFFFF' }]}
                    onPress={() => handleSelectPost(post.id)}
                  >
                    <View style={styles.postImageContainer}>
                      <Image source={post.image} style={styles.postImage} resizeMode="contain" />
                      <View style={styles.cardCategoryBadge}>
                        <ThemedText style={styles.cardCategoryText}>{post.category.toUpperCase()}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.postDetails}>
                      <View style={styles.postMetaRow}>
                        <ThemedText style={styles.cardAuthor}>By {post.author}</ThemedText>
                        <View style={styles.dividerDot} />
                        <ThemedText style={styles.cardReadTime}>{post.readTime}</ThemedText>
                      </View>

                      <ThemedText style={styles.cardTitle}>{post.title}</ThemedText>
                      <ThemedText style={styles.cardSnippet} numberOfLines={3}>
                        {post.snippet}
                      </ThemedText>

                      <View style={styles.cardFooter}>
                        <ThemedText style={styles.readMoreText}>Read Article</ThemedText>
                        <Ionicons name="arrow-forward" size={14} color="#A06E50" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* Footer */}
        <FooterHero />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  webScrollContent: {
    alignItems: 'center',
  },
  innerLayout: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.xl,
    minHeight: 520,
  },
  feedContainer: {
    marginBottom: Spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 640,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9F8F6',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  categoryPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  categoryPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#666',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'flex-start',
  },
  desktopPostsGrid: {
    gap: 24,
  },
  postCard: {
    width: Platform.OS === 'web' && windowWidth > 768 ? '31.5%' : '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  postImageContainer: {
    height: 220,
    backgroundColor: '#F9F8F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  postImage: {
    width: '80%',
    height: '80%',
  },
  cardCategoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardCategoryText: {
    fontSize: 8,
    fontFamily: 'Inter-Bold',
    color: '#111',
    letterSpacing: 1,
  },
  postDetails: {
    padding: 20,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardAuthor: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#888',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginHorizontal: 8,
  },
  cardReadTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#A06E50',
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#111',
    lineHeight: 24,
    marginBottom: 10,
  },
  cardSnippet: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
  },

  /* ARTICLE DETAIL VIEW STYLING */
  detailContainer: {
    marginBottom: Spacing.xl,
    paddingTop: 10,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
  },
  backLinkText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#A06E50',
    letterSpacing: 1.5,
  },
  detailLayout: {
    width: '100%',
  },
  desktopDetailLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailBody: {
    width: '100%',
  },
  detailCategory: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#A06E50',
    letterSpacing: 2,
    marginBottom: 12,
  },
  detailTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: '#111',
    lineHeight: 40,
    marginBottom: 16,
  },
  detailSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 30,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    marginBottom: 40,
    flexWrap: 'wrap',
    gap: 4,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F1EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#A06E50',
  },
  authorName: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },
  authorRole: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 1,
  },
  postDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1ECE6',
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#A06E50',
  },
  paragraphsContainer: {
    gap: 22,
  },
  paragraphText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#333',
    lineHeight: 26,
  },
  detailImageCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  detailImageWrapper: {
    height: 380,
    backgroundColor: '#F9F8F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
  },
  detailImage: {
    width: '90%',
    height: '90%',
  },
  editorialQuoteCard: {
    backgroundColor: '#FDFBF9',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1ECE6',
    gap: 12,
  },
  editorialQuote: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
});
