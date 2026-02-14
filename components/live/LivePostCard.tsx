import { View, Text, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { LivePost } from "../../types";
import { memo } from "react";

interface LivePostCardProps {
  post: LivePost;
  cardWidth: number;
}

function LivePostCard({ post, cardWidth }: LivePostCardProps) {
  // Handle both local requires and URI strings
  const imageSource: ImageSourcePropType = typeof post.imageUrl === 'string' 
    ? { uri: post.imageUrl }
    : post.imageUrl;

  // Calculate image height maintaining aspect ratio (approximately 1.66:1)
  const imageHeight = cardWidth * 1.66;

  return (
    <View style={[styles.container, { width: cardWidth }]}>
      <Text style={[styles.sellerName, { width: cardWidth }]}>{post.sellerName}</Text>
      <View style={[styles.imageContainer, { width: cardWidth, height: imageHeight }]}>
        <Image 
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`${post.sellerName} live post`}
        />
      </View>
      <Text style={[styles.postDescription, { width: cardWidth }]} numberOfLines={3}>
        {post.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 6,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  imageContainer: {
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    borderWidth: 0.7,
    borderColor: '#000000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sellerName: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
  },
  postDescription: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 20,
  },
});

export default memo(LivePostCard);
