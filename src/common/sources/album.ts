/* eslint-disable @typescript-eslint/no-explicit-any */

import { Store } from "vuex";
import { TrackSource } from "@/common/spotify";
import { fetchPaginated } from "@/common/util";

export class Album implements TrackSource {
  data: any;

  static get promptText(): string {
    return "Enter an album URL or ID here";
  }

  static async fetch(store: Store<any>, id: string): Promise<Album> {
    const token = store.state.token;

    const data = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      method: "GET",
      headers: new Headers({
        Authorization: `${token.tokenType} ${token.accessToken}`,
      }),
    })
      .then((data) => data.json())
      .then((data) => {
        if (data.error) throw new Error(`Error loading album: ${data.error.message}`);
        return data;
      });

    await fetchPaginated(data.tracks, data.tracks.next, token);

    for (const track of data.tracks.items) {
      // TODO: possibly copy album object, except without items
      track["_albumName"] = data.name;
      track["_albumImages"] = data.images;
    }

    return new Album(data);
  }

  private constructor(data: any) {
    this.data = data;
  }

  get displayFields(): Map<string, unknown> {
    return new Map([
      ["Type", this.data.type],
      ["Title", this.data.name],
      ["Artists", this.data.artists.map((a: any) => a.name).join(", ")],
      ["Label", this.data.label],
      ["Track count", this.data.total_tracks],
      ["Release date", this.data.release_date],
      ["ID (Spotify URI)", this.data.uri],
    ]);
  }

  get displayTitle(): string {
    return `${this.data.name} by ${this.data.artists.map((a: any) => a.name).join(", ")}`;
  }

  get trackCount(): number {
    return this.data.total_tracks;
  }

  get tracks(): Array<any> {
    return this.data.tracks.items;
  }

  get image(): string {
    return this.data.images[0].url;
  }

  getTrackAlbum(): string {
    return this.data.name;
  }

  getTrackImage(): string {
    return this.image;
  }
}
