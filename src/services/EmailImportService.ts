import { EmailRepository } from "../datastore/repositories/EmailRepository";
import { MessageRepository } from "../datastore/repositories/MessageRepository";
import { ThreadRepository } from "../datastore/repositories/ThreadRepository";
import { UserRepository } from "../datastore/repositories/UserRepository";
import { EmailEntity } from "../model/entities/EmailEntity";
import { MessageEntity } from "../model/entities/MessageEntity";
import { ThreadEntity } from "../model/entities/ThreadEntity";
import { EmailFetcherService } from "./EmailFetcherService";

export class EmailImportService {
  constructor(
    private readonly emailFetcherService: EmailFetcherService,
    private readonly emailRepository: EmailRepository,
    private readonly messageRepository: MessageRepository,
    private readonly threadRepository: ThreadRepository,
    private readonly userRepository: UserRepository
  ) {}
  
  public async import(): Promise<void> {
    const fetchedEmails = await this.retrieveAndPersistEmails();
    const threads = await this.threadRepository.findAll();
    fetchedEmails.map((email) => {
      let thread = this.findThread(threads, email);
      if (!thread) {
	thread = this.createThread(email);
	threads.push(thread);
      }
    });
    await this.threadRepository.persist(threads);

    const messages = await Promise.all(fetchedEmails.map(async (email) => {
      return this.createMessageFromEmail(email, threads);
    }));
    await this.messageRepository.persist(messages);
  } 

  private async retrieveAndPersistEmails() {
    const fetchedEmails = await this.emailFetcherService.fetch();
    await this.emailRepository.persist(fetchedEmails);
    return fetchedEmails;
  }

  private findThread(threads: ThreadEntity[], email: EmailEntity): ThreadEntity | null {
    let threadName = email.universalMessageId.email.toString();
    if (email.inReplyTo) {
      threadName = email.inReplyTo.email.toString();
    }
    let thread = threads.find((element) => element.name == threadName);
    if (!thread)
      return null;
    return thread;
  }


  private createThread(email: EmailEntity): ThreadEntity {
    let threadName = email.universalMessageId.email.toString();
    if (email.inReplyTo) {
      threadName = email.inReplyTo.email.toString();
    }
    return new ThreadEntity(threadName);
  }

  private async createMessageFromEmail(email: EmailEntity, threads: ThreadEntity[]): Promise<MessageEntity> {
    const user = await this.userRepository.findByEmail(email.from.email);
    const messageSenderId = user?.id ?? null;
    const thread = this.findThread(threads, email);
    if (thread) {
      const message = MessageEntity.createFromEmail(messageSenderId, thread.id!, email);
      return message;
    }
    throw Error("Creating a message not belonging to a thread is not allowed");
  }
}
