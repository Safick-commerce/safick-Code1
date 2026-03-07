import { View, FlatList, StyleSheet, ListRenderItem, Dimensions } from "react-native";
import LivePostCard from "./LivePostCard";
import { LivePost } from "../../types";
import { memo, useCallback, useMemo, ReactElement } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LivePostsGridProps {
  posts: LivePost[];
  postsPerRow?: number;
  ListHeaderComponent?: ReactElement;
}

function LivePostsGrid({ posts, postsPerRow = 2, ListHeaderComponent }: LivePostsGridProps) {
  // Calculate card width based on screen size
  // Account for: horizontal padding (10), gaps between cards (12), and margins (6 * 2 per card)
  const cardWidth = useMemo(() => {
    const horizontalPadding = 10; // paddingHorizontal from filtersContainer
    const rowPadding = 5 * 2; // paddingHorizontal from row style
    const cardMargin = 6 * 2; // marginHorizontal per card
    const gapBetweenCards = 12; // gap between cards in a row
    
    const availableWidth = SCREEN_WIDTH - horizontalPadding - rowPadding;
    const totalMarginsAndGaps = (cardMargin * postsPerRow) + (gapBetweenCards * (postsPerRow - 1));
    return (availableWidth - totalMarginsAndGaps) / postsPerRow;
  }, [postsPerRow]);

  // Group posts into rows
  const groupedPosts: LivePost[][] = [];
  for (let i = 0; i < posts.length; i += postsPerRow) {
    groupedPosts.push(posts.slice(i, i + postsPerRow));
  }

  const renderRow: ListRenderItem<LivePost[]> = useCallback(({ item: rowPosts }) => (
    <View style={styles.row}>
      {rowPosts.map((post) => (
        <LivePostCard key={post.id} post={post} cardWidth={cardWidth} />
      ))}
    </View>
  ), [cardWidth]);

  const keyExtractor = useCallback((item: LivePost[], index: number) => 
    `row-${index}`, []);

  return (
    <FlatList
      data={groupedPosts}
      renderItem={renderRow}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={5}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginTop: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export default memo(LivePostsGrid);
